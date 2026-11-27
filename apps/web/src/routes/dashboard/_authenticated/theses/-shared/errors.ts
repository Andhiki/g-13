export const THESIS_ADMIN_ERRORS = Object.freeze({
  FORBIDDEN: "FORBIDDEN",
  THESIS_ACTION_UNAVAILABLE: "THESIS_ACTION_UNAVAILABLE",
  SLUG_TAKEN: "SLUG_TAKEN",
  CONSENT_REQUIRED: "CONSENT_REQUIRED",
});

export type ThesisAdminError = (typeof THESIS_ADMIN_ERRORS)[keyof typeof THESIS_ADMIN_ERRORS];

export type ThesisAdminResult<T> =
  { data: T; error: null } | { data: null; error: ThesisAdminError };
