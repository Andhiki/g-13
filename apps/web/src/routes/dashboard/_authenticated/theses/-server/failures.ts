import { rejectServerFunction } from "@/server/server-function-error";
import { THESIS_ADMIN_ERRORS, type ThesisAdminError } from "../-shared/errors";

const thesisAdminErrorStatuses = {
  [THESIS_ADMIN_ERRORS.FORBIDDEN]: 403,
  [THESIS_ADMIN_ERRORS.THESIS_ACTION_UNAVAILABLE]: 404,
  [THESIS_ADMIN_ERRORS.SLUG_TAKEN]: 409,
  [THESIS_ADMIN_ERRORS.CONSENT_REQUIRED]: 400,
} satisfies Record<ThesisAdminError, number>;

export function rejectThesisAdminOperation(error: ThesisAdminError): never {
  return rejectServerFunction(thesisAdminErrorStatuses[error], error);
}
