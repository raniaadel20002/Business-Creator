// Re-export barrel: geminiService.ts and validationEngine.ts import from
// './prompts/projectPrompts.js' (one level), but the file is physically located
// at './prompts/prompts/projectPrompts.ts' (double-nested due to a historic accident).
// This module bridges the gap without moving the original file.
export * from './prompts/projectPrompts.js';
