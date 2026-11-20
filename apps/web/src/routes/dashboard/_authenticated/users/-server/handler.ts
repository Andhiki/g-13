import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { requireAdminSession } from "@/server/auth";
import { runServerOperation } from "@/server/server-function-error";
import { assignRoleSchema, userPageSchema } from "../-shared/schemas";
import { rejectUserOperation } from "./failures";
import { approveUserRole, inspectUsers } from "./service";

export const loadAdminUsers = createServerFn({ method: "GET" })
  .validator(userPageSchema)
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "manage-users");
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
  .validator(assignRoleSchema)
  .handler(async ({ data }) => {
    const session = await requireAdminSession(getRequestHeaders(), "manage-users");
    const result = await runServerOperation(() =>
      approveUserRole(createDatabase(env.DB), session.user, data),
    );
    if (result.error !== null) rejectUserOperation(result.error);
    return result.data;
  });
