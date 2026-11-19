import { canManageUsers } from "@g13/auth";
import type { createDatabase } from "@g13/db/client";
import { dispatchNotification } from "@/server/notifications";
import type { AssignRoleInput, UserStatus } from "../-shared/schemas";
import { USER_ERRORS, type UserOperationResult } from "../-shared/errors";
import { assignUserRole, getUserCounts, listAdminUsers } from "./repository";

type Database = ReturnType<typeof createDatabase>;
type UserListData = {
  rows: Awaited<ReturnType<typeof listAdminUsers>>;
  counts: Awaited<ReturnType<typeof getUserCounts>>;
};
type RoleUpdateData = Pick<AssignRoleInput, "userId" | "role">;
type Actor = { id: string; role?: string | null };

export async function inspectUsers(
  db: Database,
  actor: Actor,
  offset = 0,
  status: UserStatus = "all",
): Promise<UserOperationResult<UserListData>> {
  if (!canManageUsers(actor.role)) return { data: null, error: USER_ERRORS.FORBIDDEN };
  const [rows, counts] = await Promise.all([listAdminUsers(db, offset, status), getUserCounts(db)]);
  return { data: { rows, counts }, error: null };
}

export async function approveUserRole(
  db: Database,
  actor: Actor,
  input: AssignRoleInput,
): Promise<UserOperationResult<RoleUpdateData>> {
  if (!canManageUsers(actor.role) || input.userId === actor.id) {
    return { data: null, error: USER_ERRORS.FORBIDDEN };
  }
  if (!(await assignUserRole(db, input))) {
    return { data: null, error: USER_ERRORS.USER_NOT_FOUND };
  }
  try {
    await dispatchNotification(db, {
      type: "user.role_updated",
      resourceType: "user",
      resourceId: input.userId,
      actorId: actor.id,
      payload: { role: input.role },
      recipients: { userIds: [input.userId], excludeUserIds: [actor.id] },
    });
  } catch {
    // Notification delivery is non-blocking for role assignment.
  }
  return { data: { userId: input.userId, role: input.role }, error: null };
}
