export const LECTURER_ADMIN_ERRORS = Object.freeze({
  FORBIDDEN: "FORBIDDEN",
  LECTURER_ACTION_UNAVAILABLE: "LECTURER_ACTION_UNAVAILABLE",
});

export type LecturerAdminError = (typeof LECTURER_ADMIN_ERRORS)[keyof typeof LECTURER_ADMIN_ERRORS];

export type LecturerAdminResult<T> =
  { data: T; error: null } | { data: null; error: LecturerAdminError };
