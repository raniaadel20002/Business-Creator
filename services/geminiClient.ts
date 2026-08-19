import { GoogleGenAI } from "@google/genai";

function getGeminiApiKey(): string | undefined {
  // 1. In Vite browser build: statically inlined during vite build
  try {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
    if (envKey) return envKey;
  } catch (e) {}

  // 2. In Node.js / Vercel Serverless runtime: read from process.env
  try {
    if (typeof process !== 'undefined' && process.env) {
      const procKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || (process.env as any).geminiApiKey;
      if (procKey) return procKey;
    }
  } catch (e) {}

  return "AIzaSyBMEPQ7zM9akR0ht5AQryrCPQ65asqpZog";
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
