import { GoogleGenAI } from "@google/genai";

const DEFAULT_GEMINI_KEY = "AIzaSyBMEPQ7zM9akR0ht5AQryrCPQ65asqpZog";
const COOLDOWN_DURATION_MS = 2 * 60 * 1000; // 2 minutes (120 seconds)

/**
 * Parses keys from environment strings (comma, semicolon, or newline-separated).
 */
function extractKeysFromEnv(): string[] {
  const rawKeyStrings: string[] = [];

  // 1. In Vite browser build (import.meta.env)
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const vKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
      if (vKey) rawKeyStrings.push(String(vKey));
    }
  } catch (e) {}

  // 2. In Node.js / Serverless runtime (process.env)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const procKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || (process.env as any).geminiApiKey;
      if (procKey) rawKeyStrings.push(String(procKey));
    }
  } catch (e) {}

  const keys: string[] = [];
  for (const raw of rawKeyStrings) {
    // Split by comma, semicolon, or newline to support both single and multiple keys
    const parts = raw.split(/[,;\n\r]+/);
    for (let part of parts) {
      part = part.trim().replace(/^["']|["']$/g, ""); // strip quotes and whitespace
      // Validate that it is a valid Google AI Studio Gemini API Key (starts with AIzaSy)
      if (part && part.startsWith("AIzaSy") && !keys.includes(part)) {
        keys.push(part);
      }
    }
  }

  if (keys.length === 0) {
    keys.push(DEFAULT_GEMINI_KEY);
  }

  return keys;
}

/**
 * Smart Multi-Key Pool Manager
 * - Strict FIFO Queue: Key used at head moves to the back (tail) of the queue.
 * - 2-Minute Cooldown: Keys hitting 429/Resource Exhausted are paused for 120s.
 * - Continuity & Failover: Retries single operations seamlessly with next healthy key.
 */
class GeminiKeyPoolManager {
  private keys: string[] = [];
  private cooldownMap = new Map<string, number>();
  private clientCache = new Map<string, GoogleGenAI>();

  constructor() {
    this.refreshKeys();
  }

  public refreshKeys(): void {
    this.keys = extractKeysFromEnv();
    console.log(`[Gemini Key Pool] Loaded ${this.keys.length} API key(s) into active FIFO rotation.`);
  }

  public get totalKeysCount(): number {
    return this.keys.length;
  }

  private getClientForKey(key: string): GoogleGenAI {
    if (!this.clientCache.has(key)) {
      this.clientCache.set(
        key,
        new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        })
      );
    }
    return this.clientCache.get(key)!;
  }

  /**
   * Selects the next eligible key from the FIFO queue and immediately moves it to the back.
   */
  public getNextClient(): { client: GoogleGenAI; key: string; keyIndex: number } {
    if (this.keys.length === 0) {
      this.refreshKeys();
    }

    const now = Date.now();
    let selectedKeyIndex = -1;

    // 1. Search for first key in queue whose 2-minute cooldown has expired
    for (let i = 0; i < this.keys.length; i++) {
      const key = this.keys[i];
      const cooldownUntil = this.cooldownMap.get(key) || 0;
      if (now >= cooldownUntil) {
        selectedKeyIndex = i;
        break;
      }
    }

    // 2. If all keys are currently cooling down, pick the one that will recover earliest
    if (selectedKeyIndex === -1) {
      let earliestTime = Infinity;
      selectedKeyIndex = 0;
      for (let i = 0; i < this.keys.length; i++) {
        const key = this.keys[i];
        const cooldownUntil = this.cooldownMap.get(key) || 0;
        if (cooldownUntil < earliestTime) {
          earliestTime = cooldownUntil;
          selectedKeyIndex = i;
        }
      }
      const waitSeconds = Math.max(0, Math.ceil((earliestTime - now) / 1000));
      console.warn(`[Gemini Key Pool] All ${this.keys.length} keys in cooldown. Earliest recovery in ~${waitSeconds}s.`);
    }

    // Extract the selected key from its position
    const [selectedKey] = this.keys.splice(selectedKeyIndex, 1);
    // Strict FIFO: Put the used key at the end of the queue
    this.keys.push(selectedKey);

    const client = this.getClientForKey(selectedKey);
    const maskedKey = selectedKey.length > 10 
      ? `${selectedKey.substring(0, 5)}...${selectedKey.substring(selectedKey.length - 4)}` 
      : "key";

    console.log(`[Gemini Key Pool] Dispatching request with key [${maskedKey}] (FIFO position rotated to end)`);

    return {
      client,
      key: selectedKey,
      keyIndex: this.keys.length - 1
    };
  }

  /**
   * Puts a key on cooldown for exactly 2 minutes (120 seconds).
   */
  public markCooldown(key: string): void {
    const cooldownUntil = Date.now() + COOLDOWN_DURATION_MS;
    this.cooldownMap.set(key, cooldownUntil);
    const maskedKey = key.length > 10 
      ? `${key.substring(0, 5)}...${key.substring(key.length - 4)}` 
      : "key";
    console.warn(`[Gemini Key Pool] Key [${maskedKey}] hit rate limit/quota. Placed on 2-minute cooldown until ${new Date(cooldownUntil).toLocaleTimeString()}.`);
  }

  /**
   * Helper to determine if an error is quota/rate-limit related
   */
  public isQuotaError(error: any): boolean {
    if (!error) return false;
    const errStr = (typeof error === 'object' ? JSON.stringify(error) : String(error)).toLowerCase();
    const status = error?.status || error?.statusCode || error?.response?.status;
    return (
      status === 429 ||
      errStr.includes("429") ||
      errStr.includes("resource_exhausted") ||
      errStr.includes("quota") ||
      errStr.includes("rate limit") ||
      errStr.includes("too many requests")
    );
  }
}

// Global Singleton Pool Instance
export const geminiKeyPool = new GeminiKeyPoolManager();

/**
 * Returns a GoogleGenAI client according to strict FIFO round-robin rotation.
 */
export function createGeminiClient(): GoogleGenAI {
  return geminiKeyPool.getNextClient().client;
}

/**
 * Executes an individual operation against the pool with automatic failover and 2-minute cooldown.
 * If 429 occurs, it automatically retries with the next healthy key in the queue.
 */
export async function executeWithGeminiPool<T>(
  operation: (client: GoogleGenAI, key: string) => Promise<T>,
  maxRetries?: number
): Promise<T> {
  const maxAttempts = maxRetries ?? Math.max(geminiKeyPool.totalKeysCount, 2);
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { client, key } = geminiKeyPool.getNextClient();
    try {
      return await operation(client, key);
    } catch (error: any) {
      lastError = error;
      if (geminiKeyPool.isQuotaError(error)) {
        geminiKeyPool.markCooldown(key);
        console.warn(`[Gemini Pool Failover] Attempt ${attempt}/${maxAttempts} hit quota limit. Switching to next key in queue immediately...`);
        // Short pause to let socket reset before immediate retry on next key
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }
      // For non-quota errors, rethrow immediately
      throw error;
    }
  }

  throw lastError || new Error("All keys in Gemini pool exhausted or encountered errors.");
}

const FALLBACK_GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

export function getModelFallbackList(primaryModel?: string): string[] {
  const preferred = (primaryModel && primaryModel !== "gemini-2.5-flash" && primaryModel !== "gemini-2.0-flash") 
    ? primaryModel 
    : "gemini-3.5-flash";
  const list = [preferred, ...FALLBACK_GEMINI_MODELS].filter(Boolean) as string[];
  return Array.from(new Set(list));
}
