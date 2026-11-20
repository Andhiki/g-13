import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { authorize } from "@/server/auth-middleware";
import { runServerOperation } from "@/server/server-function-error";
import {
  createLecturerSchema,
  lecturerLifecycleSchema,
  lecturerPageSchema,
  updateLecturerSchema,
} from "../-shared/schemas";
import { rejectLecturerAdminOperation } from "./failures";
import {
  changeLecturerLifecycle,
  createLecturer,
  inspectLecturers,
  updateLecturer,
} from "./service";

export const loadAdminLecturers = createServerFn({ method: "GET" })
  .middleware([authorize("moderate")])
  .validator(lecturerPageSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      inspectLecturers(createDatabase(env.DB), session.user, data.offset, data.status),
    );
    if (result.error !== null) rejectLecturerAdminOperation(result.error);
    return {
      ...result.data,
      identity: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
        image: session.user.image,
      },
    };
  });

export const createAdminLecturer = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(createLecturerSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      createLecturer(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectLecturerAdminOperation(result.error);
    return result.data;
  });

export const updateAdminLecturer = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(updateLecturerSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      updateLecturer(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectLecturerAdminOperation(result.error);
    return result.data;
  });

export const changeAdminLecturerLifecycle = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(lecturerLifecycleSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      changeLecturerLifecycle(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectLecturerAdminOperation(result.error);
    return result.data;
  });
