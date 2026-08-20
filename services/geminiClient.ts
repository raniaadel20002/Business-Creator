import { GoogleGenAI } from "@google/genai";

const DEFAULT_GEMINI_KEY = "AIzaSyBMEPQ7zM9akR0ht5AQryrCPQ65asqpZog";

function getGeminiApiKey(): string {
  // 1. In Vite browser build: statically inlined during vite build
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const vKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
      if (vKey) return vKey;
    }
  } catch (e) {}

  // 2. In Node.js / Vercel Serverless runtime: read from process.env
  try {
    if (typeof process !== 'undefined' && process.env) {
      const procKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || (process.env as any).geminiApiKey;
      if (procKey) return procKey;
    }
  } catch (e) {}

  return DEFAULT_GEMINI_KEY;
}

export function createGeminiClient(): GoogleGenAI {
  const key = getGeminiApiKey();
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
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
