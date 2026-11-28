import { rejectServerFunction } from "@/server/server-function-error";
import {
  ANNOUNCEMENT_ADMIN_ERRORS,
  type AnnouncementAdminError,
  type AnnouncementWriteResult,
} from "../-shared/errors";

const announcementErrorStatuses = {
  [ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN]: 403,
  [ANNOUNCEMENT_ADMIN_ERRORS.ANNOUNCEMENT_UNAVAILABLE]: 409,
  [ANNOUNCEMENT_ADMIN_ERRORS.INVALID_SCHEDULE]: 400,
} satisfies Record<AnnouncementAdminError, number>;

export function rejectAnnouncementOperation(error: AnnouncementAdminError): never {
  return rejectServerFunction(announcementErrorStatuses[error], error);
}

/** Returns a write's data, its schedule conflicts for the admin to confirm, or throws. */
export function respondToAnnouncementWrite<T>(result: AnnouncementWriteResult<T>) {
  if (result.error === "SCHEDULE_CONFLICT") return { conflicts: result.conflicts };
  if (result.error !== null) return rejectAnnouncementOperation(result.error);
  return result.data;
}
