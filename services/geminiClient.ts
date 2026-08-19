import { GoogleGenAI } from "@google/genai";

function getGeminiApiKey(): string | undefined {
  let key: string | undefined = undefined;
  try {
    if (typeof process !== 'undefined' && process.env) {
      key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || (process.env as any).geminiApiKey;
    }
  } catch (e) {}

  if (!key) {
    try {
      if (typeof import.meta !== 'undefined' && (import.meta as any)?.env) {
        key = (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY;
      }
    } catch (e) {}
  }
  return key;
}

export function createGeminiClient(): GoogleGenAI {
  const key = getGeminiApiKey();
  return new GoogleGenAI({
    ...(key ? { apiKey: key } : {}),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const FALLBACK_GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-flash"
];

export function getModelFallbackList(primaryModel?: string): string[] {
  const list = [primaryModel, ...FALLBACK_GEMINI_MODELS].filter(Boolean) as string[];
  return Array.from(new Set(list));
}
