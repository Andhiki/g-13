import { createServerFn } from "@tanstack/react-start";
import { authorize } from "@/server/auth-middleware";
import { loadAdminPage, runAdminOperation } from "../../-server/admin-handler";
import { USER_ERRORS, type UserOperationError } from "../-shared/errors";
import { assignRoleSchema, userPageSchema } from "../-shared/schemas";
import { approveUserRole, inspectUsers } from "./service";

const userErrorStatuses = {
  [USER_ERRORS.FORBIDDEN]: 403,
  [USER_ERRORS.USER_NOT_FOUND]: 404,
} satisfies Record<UserOperationError, number>;

export const loadAdminUsers = createServerFn({ method: "GET" })
  .middleware([authorize("manage-users")])
  .validator(userPageSchema)
  .handler(({ data, context: { session } }) =>
    loadAdminPage(session.user, userErrorStatuses, (db) =>
      inspectUsers(db, session.user, data.offset, data.status),
    ),
  );

export const changeUserRole = createServerFn({ method: "POST" })
  .middleware([authorize("manage-users")])
  .validator(assignRoleSchema)
  .handler(({ data, context: { session } }) =>
    runAdminOperation(userErrorStatuses, (db) => approveUserRole(db, session.user, data)),
  );
