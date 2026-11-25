// Server-side type re-exports for server/services/ai/prompts/prompts/*.ts modules.
// server/services/ai/prompts/prompts/projectPrompts.ts imports from '../../types'.
// From that path, '../../types' resolves here (server/services/ai/types.ts).
// The canonical type definitions live in src/types/types.ts.
export type {
  UserData,
  BusinessPlan,
  UserProfile,
  SavedProject,
  SubscriptionTier,
  Step,
  ActivityLog,
  UserNotification,
  ChallengeAdviceItem,
  RejectionReport,
  ValidationResult,
  ExecutionBlueprint,
} from '../../../src/types/types';
