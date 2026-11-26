import { rejectServerFunction } from "@/server/server-function-error";
import { ANNOUNCEMENT_ADMIN_ERRORS, type AnnouncementAdminError } from "../-shared/errors";

const announcementErrorStatuses = {
  [ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN]: 403,
  [ANNOUNCEMENT_ADMIN_ERRORS.ANNOUNCEMENT_UNAVAILABLE]: 409,
  [ANNOUNCEMENT_ADMIN_ERRORS.INVALID_SCHEDULE]: 400,
} satisfies Record<AnnouncementAdminError, number>;

export function rejectAnnouncementOperation(error: AnnouncementAdminError): never {
  return rejectServerFunction(announcementErrorStatuses[error], error);
}
