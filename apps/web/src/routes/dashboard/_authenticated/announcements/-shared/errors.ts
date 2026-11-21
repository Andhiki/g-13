export const ANNOUNCEMENT_ADMIN_ERRORS = Object.freeze({
  FORBIDDEN: "FORBIDDEN",
  ANNOUNCEMENT_UNAVAILABLE: "ANNOUNCEMENT_UNAVAILABLE",
  SLUG_IN_USE: "SLUG_IN_USE",
  INVALID_SCHEDULE: "INVALID_SCHEDULE",
});

export type AnnouncementAdminError =
  (typeof ANNOUNCEMENT_ADMIN_ERRORS)[keyof typeof ANNOUNCEMENT_ADMIN_ERRORS];

export type AnnouncementAdminResult<T> =
  { data: T; error: null } | { data: null; error: AnnouncementAdminError };
