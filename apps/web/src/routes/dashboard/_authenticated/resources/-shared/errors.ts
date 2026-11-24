export const RESOURCE_ADMIN_ERRORS = Object.freeze({
  FORBIDDEN: "FORBIDDEN",
  RESOURCE_ACTION_UNAVAILABLE: "RESOURCE_ACTION_UNAVAILABLE",
});

export type ResourceAdminError = (typeof RESOURCE_ADMIN_ERRORS)[keyof typeof RESOURCE_ADMIN_ERRORS];

export type ResourceAdminResult<T> =
  { data: T; error: null } | { data: null; error: ResourceAdminError };
