import { createServerFn } from "@tanstack/react-start";
import { authorize } from "@/server/auth-middleware";
import { loadAdminPage, runAdminOperation } from "../../-server/admin-handler";
import { LECTURER_ADMIN_ERRORS, type LecturerAdminError } from "../-shared/errors";
import {
  createLecturerSchema,
  lecturerLifecycleSchema,
  lecturerPageSchema,
  updateLecturerSchema,
} from "../-shared/schemas";
import {
  changeLecturerLifecycle,
  createLecturer,
  inspectLecturers,
  updateLecturer,
} from "./service";

const lecturerErrorStatuses = {
  [LECTURER_ADMIN_ERRORS.FORBIDDEN]: 403,
  [LECTURER_ADMIN_ERRORS.LECTURER_ACTION_UNAVAILABLE]: 409,
} satisfies Record<LecturerAdminError, number>;

export const loadAdminLecturers = createServerFn({ method: "GET" })
  .middleware([authorize("moderate")])
  .validator(lecturerPageSchema)
  .handler(({ data, context: { session } }) =>
    loadAdminPage(session.user, lecturerErrorStatuses, (db) =>
      inspectLecturers(db, session.user, data.offset, data.status, data.query),
    ),
  );

export const createAdminLecturer = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(createLecturerSchema)
  .handler(({ data, context: { session } }) =>
    runAdminOperation(lecturerErrorStatuses, (db) => createLecturer(db, session.user, data)),
  );

export const updateAdminLecturer = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(updateLecturerSchema)
  .handler(({ data, context: { session } }) =>
    runAdminOperation(lecturerErrorStatuses, (db) => updateLecturer(db, session.user, data)),
  );

export const changeAdminLecturerLifecycle = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(lecturerLifecycleSchema)
  .handler(({ data, context: { session } }) =>
    runAdminOperation(lecturerErrorStatuses, (db) =>
      changeLecturerLifecycle(db, session.user, data),
    ),
  );
