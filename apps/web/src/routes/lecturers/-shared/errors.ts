export const REVIEW_ERRORS = Object.freeze({
  INVALID: "invalid",
  UNAVAILABLE: "unavailable",
  RATE_LIMIT: "rate-limit",
});

export type ReviewOperationError = (typeof REVIEW_ERRORS)[keyof typeof REVIEW_ERRORS];

export type ReviewOperationResult<T> =
  | { data: T; error: null }
  | { data: null; error: ReviewOperationError };
