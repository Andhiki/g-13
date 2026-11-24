import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { authorize } from "@/server/auth-middleware";
import { runServerOperation } from "@/server/server-function-error";
import {
  createThesisSchema,
  thesisLifecycleSchema,
  thesisPageSchema,
  updateThesisSchema,
} from "../-shared/schemas";
import { rejectThesisAdminOperation } from "./failures";
import { changeThesisLifecycle, createThesis, inspectTheses, updateThesis } from "./service";

export const loadAdminTheses = createServerFn({ method: "GET" })
  .middleware([authorize("moderate")])
  .validator(thesisPageSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      inspectTheses(createDatabase(env.DB), session.user, data.offset, data.status),
    );
    if (result.error !== null) rejectThesisAdminOperation(result.error);
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

export const createAdminThesis = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(createThesisSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      createThesis(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectThesisAdminOperation(result.error);
    return result.data;
  });

export const updateAdminThesis = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(updateThesisSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      updateThesis(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectThesisAdminOperation(result.error);
    return result.data;
  });

export const changeAdminThesisLifecycle = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(thesisLifecycleSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      changeThesisLifecycle(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectThesisAdminOperation(result.error);
    return result.data;
  });
