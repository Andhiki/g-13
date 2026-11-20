export const MODERATION_ERRORS = Object.freeze({
  FORBIDDEN: "FORBIDDEN",
  // Includes missing, deleted, and otherwise ineligible reviews for the requested transition.
  REVIEW_ACTION_UNAVAILABLE: "REVIEW_ACTION_UNAVAILABLE",
});

export type ModerationOperationError = (typeof MODERATION_ERRORS)[keyof typeof MODERATION_ERRORS];

export type ModerationOperationResult<T> =
  { data: T; error: null } | { data: null; error: ModerationOperationError };
