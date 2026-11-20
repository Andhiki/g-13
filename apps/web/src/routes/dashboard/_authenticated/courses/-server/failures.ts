import { rejectServerFunction } from "@/server/server-function-error";
import { COURSE_ADMIN_ERRORS, type CourseAdminError } from "../-shared/errors";

const courseErrorStatuses = {
  [COURSE_ADMIN_ERRORS.FORBIDDEN]: 403,
  [COURSE_ADMIN_ERRORS.COURSE_ACTION_UNAVAILABLE]: 409,
} satisfies Record<CourseAdminError, number>;

export function rejectCourseAdminOperation(error: CourseAdminError): never {
  return rejectServerFunction(courseErrorStatuses[error], error);
}
