export const RESOURCE_ADMIN_ERRORS = Object.freeze({
  FORBIDDEN: "FORBIDDEN",
  RESOURCE_ACTION_UNAVAILABLE: "RESOURCE_ACTION_UNAVAILABLE",
});

export type ResourceAdminError = (typeof RESOURCE_ADMIN_ERRORS)[keyof typeof RESOURCE_ADMIN_ERRORS];

export type ResourceAdminResult<T> =
  { data: T; error: null } | { data: null; error: ResourceAdminError };

const knownResourceErrorMessages = new Set<string>(Object.values(RESOURCE_ADMIN_ERRORS));

/** A validation message from the server; known error codes keep the generic fallback. */
export function resourceMutationErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;
  const message = error.message.trim();
  if (message === "" || message === "INTERNAL_ERROR" || knownResourceErrorMessages.has(message)) {
    return undefined;
  }
  return message;
}
