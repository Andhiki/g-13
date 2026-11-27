import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { authorize } from "@/server/auth-middleware";
import { runServerOperation } from "@/server/server-function-error";
import {
  createResourceSchema,
  reorderResourcesSchema,
  resourceLifecycleSchema,
  resourcePageSchema,
  updateResourceSchema,
} from "../-shared/schemas";
import { rejectResourceAdminOperation } from "./failures";
import {
  changeResourceLifecycle,
  createResource,
  inspectResources,
  reorderResources,
  updateResource,
} from "./service";
import { validateResourceInput } from "./validation";

export const loadAdminResources = createServerFn({ method: "GET" })
  .middleware([authorize("moderate")])
  .validator(validateResourceInput(resourcePageSchema))
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      inspectResources(createDatabase(env.DB), session.user, data.offset, data.status, data.query),
    );
    if (result.error !== null) rejectResourceAdminOperation(result.error);
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

export const createAdminResource = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(validateResourceInput(createResourceSchema))
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      createResource(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectResourceAdminOperation(result.error);
    return result.data;
  });

export const updateAdminResource = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(validateResourceInput(updateResourceSchema))
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      updateResource(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectResourceAdminOperation(result.error);
    return result.data;
  });

export const changeAdminResourceLifecycle = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(validateResourceInput(resourceLifecycleSchema))
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      changeResourceLifecycle(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectResourceAdminOperation(result.error);
    return result.data;
  });

export const reorderAdminResources = createServerFn({ method: "POST" })
  .middleware([authorize("moderate")])
  .validator(validateResourceInput(reorderResourcesSchema))
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      reorderResources(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectResourceAdminOperation(result.error);
    return result.data;
  });
