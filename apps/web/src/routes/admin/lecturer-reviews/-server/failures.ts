import { rejectServerFunction } from "@/server/server-function-error";
import { MODERATION_ERRORS, type ModerationOperationError } from "../-shared/errors";

const moderationErrorStatuses = {
  [MODERATION_ERRORS.FORBIDDEN]: 403,
  [MODERATION_ERRORS.REVIEW_ACTION_UNAVAILABLE]: 409,
} satisfies Record<ModerationOperationError, number>;

export function rejectModerationOperation(error: ModerationOperationError): never {
  return rejectServerFunction(moderationErrorStatuses[error], error);
}
