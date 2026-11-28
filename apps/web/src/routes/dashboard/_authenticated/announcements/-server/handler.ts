import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { authorize } from "@/server/auth-middleware";
import { rejectServerFunction, runServerOperation } from "@/server/server-function-error";
import { loadAdminPage } from "../../-server/admin-handler";
import {
  ANNOUNCEMENT_ADMIN_ERRORS,
  type AnnouncementAdminError,
  type AnnouncementWriteResult,
} from "../-shared/errors";
import {
  announcementLifecycleSchema,
  announcementPageSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "../-shared/schemas";
import {
  changeAnnouncementLifecycle,
  createAnnouncement,
  inspectAnnouncements,
  updateAnnouncement,
} from "./service";

const announcementErrorStatuses = {
  [ANNOUNCEMENT_ADMIN_ERRORS.FORBIDDEN]: 403,
  [ANNOUNCEMENT_ADMIN_ERRORS.ANNOUNCEMENT_UNAVAILABLE]: 409,
  [ANNOUNCEMENT_ADMIN_ERRORS.INVALID_SCHEDULE]: 400,
} satisfies Record<AnnouncementAdminError, number>;

function respondToAnnouncementWrite<T>(result: AnnouncementWriteResult<T>) {
  if (result.error === "SCHEDULE_CONFLICT") return { conflicts: result.conflicts };
  if (result.error !== null) {
    return rejectServerFunction(announcementErrorStatuses[result.error], result.error);
  }
  return result.data;
}

export const loadAdminAnnouncements = createServerFn({ method: "GET" })
  .middleware([authorize("manage-users")])
  .validator(announcementPageSchema)
  .handler(({ data, context: { session } }) =>
    loadAdminPage(session.user, announcementErrorStatuses, (db) =>
      inspectAnnouncements(db, session.user, data.offset, data.status, data.query),
    ),
  );

export const createAdminAnnouncement = createServerFn({ method: "POST" })
  .middleware([authorize("manage-users")])
  .validator(createAnnouncementSchema)
  .handler(async ({ data, context: { session } }) =>
    respondToAnnouncementWrite(
      await runServerOperation(() =>
        createAnnouncement(createDatabase(env.DB), session.user, data),
      ),
    ),
  );

export const updateAdminAnnouncement = createServerFn({ method: "POST" })
  .middleware([authorize("manage-users")])
  .validator(updateAnnouncementSchema)
  .handler(async ({ data, context: { session } }) =>
    respondToAnnouncementWrite(
      await runServerOperation(() =>
        updateAnnouncement(createDatabase(env.DB), session.user, data),
      ),
    ),
  );

export const changeAdminAnnouncementLifecycle = createServerFn({ method: "POST" })
  .middleware([authorize("manage-users")])
  .validator(announcementLifecycleSchema)
  .handler(async ({ data, context: { session } }) =>
    respondToAnnouncementWrite(
      await runServerOperation(() =>
        changeAnnouncementLifecycle(createDatabase(env.DB), session.user, data),
      ),
    ),
  );
