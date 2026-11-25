// Server-side type re-exports for server/services/ai/*.ts modules.
// All server/services/ai modules import shared domain types from '../types' or '../types.js'.
// From server/services/ai/, '../types' resolves here (server/services/types.ts).
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
} from '../../src/types/types';
