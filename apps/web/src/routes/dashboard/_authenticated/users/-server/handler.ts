import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { authorize } from "@/server/auth-middleware";
import { runServerOperation } from "@/server/server-function-error";
import { assignRoleSchema, userPageSchema } from "../-shared/schemas";
import { rejectUserOperation } from "./failures";
import { approveUserRole, inspectUsers } from "./service";

export const loadAdminUsers = createServerFn({ method: "GET" })
  .middleware([authorize("manage-users")])
  .validator(userPageSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      inspectUsers(createDatabase(env.DB), session.user, data.offset, data.status),
    );
    if (result.error !== null) rejectUserOperation(result.error);
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

export const changeUserRole = createServerFn({ method: "POST" })
  .middleware([authorize("manage-users")])
  .validator(assignRoleSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      approveUserRole(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectUserOperation(result.error);
    return result.data;
  });
