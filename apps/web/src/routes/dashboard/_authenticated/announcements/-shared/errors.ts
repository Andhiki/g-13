export const ANNOUNCEMENT_ADMIN_ERRORS = Object.freeze({
  FORBIDDEN: "FORBIDDEN",
  ANNOUNCEMENT_UNAVAILABLE: "ANNOUNCEMENT_UNAVAILABLE",
  INVALID_SCHEDULE: "INVALID_SCHEDULE",
});

export type AnnouncementAdminError =
  (typeof ANNOUNCEMENT_ADMIN_ERRORS)[keyof typeof ANNOUNCEMENT_ADMIN_ERRORS];

export type AnnouncementConflict = {
  id: string;
  titleEn: string;
  startsAt: Date;
  endsAt: Date | null;
};

export type AnnouncementAdminResult<T> =
  { data: T; error: null } | { data: null; error: AnnouncementAdminError };

export type AnnouncementWriteResult<T> =
  | AnnouncementAdminResult<T>
  | { data: null; error: "SCHEDULE_CONFLICT"; conflicts: AnnouncementConflict[] };
