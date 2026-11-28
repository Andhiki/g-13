import { createServerFn } from "@tanstack/react-start";
import { authorize } from "@/server/auth-middleware";
import { loadAdminPage, runAdminOperation } from "../../-server/admin-handler";
import { COURSE_ADMIN_ERRORS, type CourseAdminError } from "../-shared/errors";
import {
  courseLifecycleSchema,
  coursePageSchema,
  createCourseSchema,
  updateCourseSchema,
} from "../-shared/schemas";
import { changeCourseLifecycle, createCourse, inspectCourses, updateCourse } from "./service";

const courseErrorStatuses = {
  [COURSE_ADMIN_ERRORS.FORBIDDEN]: 403,
  [COURSE_ADMIN_ERRORS.COURSE_ACTION_UNAVAILABLE]: 409,
  [COURSE_ADMIN_ERRORS.COURSE_CODE_TAKEN]: 409,
} satisfies Record<CourseAdminError, number>;

export const loadAdminCourses = createServerFn({ method: "GET" })
  .middleware([authorize("moderate")])
  .validator(coursePageSchema)
  .handler(({ data, context: { session } }) =>
    loadAdminPage(session.user, courseErrorStatuses, (db) =>
      inspectCourses(db, session.user, data.offset, data.status, data.query),
    ),
  );

export const createAdminCourse = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(createCourseSchema)
  .handler(({ data, context: { session } }) =>
    runAdminOperation(courseErrorStatuses, (db) => createCourse(db, session.user, data)),
  );

export const updateAdminCourse = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(updateCourseSchema)
  .handler(({ data, context: { session } }) =>
    runAdminOperation(courseErrorStatuses, (db) => updateCourse(db, session.user, data)),
  );

export const changeAdminCourseLifecycle = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(courseLifecycleSchema)
  .handler(({ data, context: { session } }) =>
    runAdminOperation(courseErrorStatuses, (db) => changeCourseLifecycle(db, session.user, data)),
  );
