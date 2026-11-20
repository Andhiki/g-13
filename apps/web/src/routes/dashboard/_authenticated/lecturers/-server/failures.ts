import { rejectServerFunction } from "@/server/server-function-error";
import { LECTURER_ADMIN_ERRORS, type LecturerAdminError } from "../-shared/errors";

const lecturerErrorStatuses = {
  [LECTURER_ADMIN_ERRORS.FORBIDDEN]: 403,
  [LECTURER_ADMIN_ERRORS.LECTURER_ACTION_UNAVAILABLE]: 409,
} satisfies Record<LecturerAdminError, number>;

export function rejectLecturerAdminOperation(error: LecturerAdminError): never {
  return rejectServerFunction(lecturerErrorStatuses[error], error);
}
