// Re-export barrel: geminiService.ts imports from './ideaValidationEngine.js'
// but the class lives in './validationEngine.ts'. This module bridges the gap.
export { IdeaValidationEngine } from './validationEngine.js';
