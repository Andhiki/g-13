export const NOTIFICATION_ERRORS = {
  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
} as const;

export type NotificationError = (typeof NOTIFICATION_ERRORS)[keyof typeof NOTIFICATION_ERRORS];

export type NotificationOperationResult<T> =
  { data: T; error: null } | { data: null; error: NotificationError };
