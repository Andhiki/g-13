import { rejectServerFunction } from "@/server/server-function-error";
import { USER_ERRORS, type UserOperationError } from "../-shared/errors";

const userErrorStatuses = {
  [USER_ERRORS.FORBIDDEN]: 403,
  [USER_ERRORS.USER_NOT_FOUND]: 404,
} satisfies Record<UserOperationError, number>;

export function rejectUserOperation(error: UserOperationError): never {
  return rejectServerFunction(userErrorStatuses[error], error);
}
