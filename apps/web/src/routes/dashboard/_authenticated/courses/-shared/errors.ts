export const COURSE_ADMIN_ERRORS = Object.freeze({
  FORBIDDEN: "FORBIDDEN",
  COURSE_ACTION_UNAVAILABLE: "COURSE_ACTION_UNAVAILABLE",
});

export type CourseAdminError = (typeof COURSE_ADMIN_ERRORS)[keyof typeof COURSE_ADMIN_ERRORS];

export type CourseAdminResult<T> =
  { data: T; error: null } | { data: null; error: CourseAdminError };
