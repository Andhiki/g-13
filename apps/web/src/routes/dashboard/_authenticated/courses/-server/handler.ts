import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { requireAdminSession } from "@/server/auth";
import { runServerOperation } from "@/server/server-function-error";
import {
  courseLifecycleSchema,
  coursePageSchema,
  createCourseSchema,
  updateCourseSchema,
} from "../-shared/schemas";
import { rejectCourseAdminOperation } from "./failures";
import { changeCourseLifecycle, createCourse, inspectCourses, updateCourse } from "./service";

export const loadAdminCourses = createServerFn({ method: "GET" })
  .validator(coursePageSchema)
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "moderate");
    const result = await runServerOperation(() =>
      inspectCourses(createDatabase(env.DB), session.user, data.offset, data.status),
    );
    if (result.error !== null) rejectCourseAdminOperation(result.error);
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

export const createAdminCourse = createServerFn({ method: "POST" })
  .validator(createCourseSchema)
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "moderate");
    const result = await runServerOperation(() =>
      createCourse(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectCourseAdminOperation(result.error);
    return result.data;
  });

export const updateAdminCourse = createServerFn({ method: "POST" })
  .validator(updateCourseSchema)
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "moderate");
    const result = await runServerOperation(() =>
      updateCourse(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectCourseAdminOperation(result.error);
    return result.data;
  });

export const changeAdminCourseLifecycle = createServerFn({ method: "POST" })
  .validator(courseLifecycleSchema)
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "moderate");
    const result = await runServerOperation(() =>
      changeCourseLifecycle(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectCourseAdminOperation(result.error);
    return result.data;
  });
