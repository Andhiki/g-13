export const USER_ERRORS = Object.freeze({
  FORBIDDEN: "FORBIDDEN",
  USER_NOT_FOUND: "USER_NOT_FOUND",
});

export type UserOperationError = (typeof USER_ERRORS)[keyof typeof USER_ERRORS];

export type UserOperationResult<T> =
  | { data: T; error: null }
  | { data: null; error: UserOperationError };
