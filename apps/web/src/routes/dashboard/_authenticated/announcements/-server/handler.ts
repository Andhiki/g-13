import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { authorize } from "@/server/auth-middleware";
import { runServerOperation } from "@/server/server-function-error";
import {
  announcementLifecycleSchema,
  announcementPageSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "../-shared/schemas";
import { rejectAnnouncementOperation } from "./failures";
import {
  changeAnnouncementLifecycle,
  createAnnouncement,
  inspectAnnouncements,
  updateAnnouncement,
} from "./service";

export const loadAdminAnnouncements = createServerFn({ method: "GET" })
  .middleware([authorize("manage-users")])
  .validator(announcementPageSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      inspectAnnouncements(createDatabase(env.DB), session.user, data.offset, data.status),
    );
    if (result.error !== null) rejectAnnouncementOperation(result.error);
    return {
      ...result.data,
      identity: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        image: session.user.image,
      },
    };
  });

export const createAdminAnnouncement = createServerFn({ method: "POST" })
  .middleware([authorize("manage-users")])
  .validator(createAnnouncementSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      createAnnouncement(createDatabase(env.DB), session.user, data),
    );
    if (result.error === "SCHEDULE_CONFLICT") return { conflicts: result.conflicts };
    if (result.error !== null) rejectAnnouncementOperation(result.error);
    return result.data;
  });

export const updateAdminAnnouncement = createServerFn({ method: "POST" })
  .middleware([authorize("manage-users")])
  .validator(updateAnnouncementSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      updateAnnouncement(createDatabase(env.DB), session.user, data),
    );
    if (result.error === "SCHEDULE_CONFLICT") return { conflicts: result.conflicts };
    if (result.error !== null) rejectAnnouncementOperation(result.error);
    return result.data;
  });

export const changeAdminAnnouncementLifecycle = createServerFn({ method: "POST" })
  .middleware([authorize("manage-users")])
  .validator(announcementLifecycleSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      changeAnnouncementLifecycle(createDatabase(env.DB), session.user, data),
    );
    if (result.error === "SCHEDULE_CONFLICT") return { conflicts: result.conflicts };
    if (result.error !== null) rejectAnnouncementOperation(result.error);
    return result.data;
  });
