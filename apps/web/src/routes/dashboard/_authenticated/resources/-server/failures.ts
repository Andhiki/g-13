import { rejectServerFunction } from "@/server/server-function-error";
import { RESOURCE_ADMIN_ERRORS, type ResourceAdminError } from "../-shared/errors";

const resourceErrorStatuses = {
  [RESOURCE_ADMIN_ERRORS.FORBIDDEN]: 403,
  [RESOURCE_ADMIN_ERRORS.RESOURCE_ACTION_UNAVAILABLE]: 409,
} satisfies Record<ResourceAdminError, number>;

export function rejectResourceAdminOperation(error: ResourceAdminError): never {
  return rejectServerFunction(resourceErrorStatuses[error], error);
}
