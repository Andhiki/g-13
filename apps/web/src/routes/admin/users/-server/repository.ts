import { asc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { authUser, type createDatabase } from "@g13/db";
import type { AssignRoleInput, UserStatus } from "../-shared/schemas";

type Database = ReturnType<typeof createDatabase>;

export async function listAdminUsers(db: Database, offset: number, status: UserStatus) {
  return db
    .select({
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      createdAt: authUser.createdAt,
    })
    .from(authUser)
    .where(
      status === "all"
        ? undefined
        : status === "approved"
          ? inArray(authUser.role, ["admin", "maintainer"])
          : notInArray(authUser.role, ["admin", "maintainer"]),
    )
    .orderBy(asc(authUser.name), asc(authUser.id))
    .limit(51)
    .offset(offset);
}

export async function getUserCounts(db: Database) {
  const [counts] = await db
    .select({
      all: sql<number>`count(*)`,
      approved: sql<number>`coalesce(sum(case when ${authUser.role} in ('admin', 'maintainer') then 1 else 0 end), 0)`,
      pending: sql<number>`coalesce(sum(case when ${authUser.role} not in ('admin', 'maintainer') then 1 else 0 end), 0)`,
    })
    .from(authUser);
  return counts;
}

export async function assignUserRole(db: Database, input: AssignRoleInput): Promise<boolean> {
  const [user] = await db
    .update(authUser)
    .set({ role: input.role, updatedAt: new Date() })
    .where(eq(authUser.id, input.userId))
    .returning({ id: authUser.id });
  return user !== undefined;
}
