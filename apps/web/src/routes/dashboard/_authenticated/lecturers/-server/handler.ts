import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { requireAdminSession } from "@/server/auth";
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
  .validator(lecturerPageSchema)
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "moderate");
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
  .validator(createLecturerSchema)
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "moderate");
    const result = await runServerOperation(() =>
      createLecturer(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectLecturerAdminOperation(result.error);
    return result.data;
  });

export const updateAdminLecturer = createServerFn({ method: "POST" })
  .validator(updateLecturerSchema)
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "moderate");
    const result = await runServerOperation(() =>
      updateLecturer(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectLecturerAdminOperation(result.error);
    return result.data;
  });

export const changeAdminLecturerLifecycle = createServerFn({ method: "POST" })
  .validator(lecturerLifecycleSchema)
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "moderate");
    const result = await runServerOperation(() =>
      changeLecturerLifecycle(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectLecturerAdminOperation(result.error);
    return result.data;
  });
