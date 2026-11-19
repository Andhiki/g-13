import { expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { authUser } from "@g13/db/schema/auth";
import { eq } from "drizzle-orm";
import { createTestPlatformProxy } from "@/test/database";
import { USER_ERRORS, type UserOperationResult } from "../-shared/errors";
import { approveUserRole, inspectUsers } from "./service";

function serviceData<T>(result: UserOperationResult<T>): T {
  if (result.error !== null) throw new Error(result.error);
  return result.data;
}

it("enforces admin-only account approval and role updates", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const now = new Date();
    await db.insert(authUser).values([
      {
        id: "admin",
        name: "Administrator",
        email: "admin@example.test",
        role: "admin",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "maintainer",
        name: "Maintainer",
        email: "maintainer@example.test",
        role: "maintainer",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "user",
        name: "New User",
        email: "user@example.test",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const admin = { id: "admin", role: "admin" };

    for (const role of [undefined, null, "user", "maintainer", "moderator", "admin,user"]) {
      const actor = { id: "actor", role };
      expect(await inspectUsers(db, actor)).toEqual({ data: null, error: USER_ERRORS.FORBIDDEN });
      expect(await approveUserRole(db, actor, { userId: "user", role: "admin" })).toEqual({
        data: null,
        error: USER_ERRORS.FORBIDDEN,
      });
    }

    // Admin cannot change their own role or update missing users.
    expect(await approveUserRole(db, admin, { userId: "admin", role: "user" })).toEqual({
      data: null,
      error: USER_ERRORS.FORBIDDEN,
    });
    expect(await approveUserRole(db, admin, { userId: "missing", role: "admin" })).toEqual({
      data: null,
      error: USER_ERRORS.USER_NOT_FOUND,
    });

    const initial = serviceData(await inspectUsers(db, admin));
    expect(initial.counts).toEqual({ all: 3, pending: 1, approved: 2 });
    expect(
      serviceData(await inspectUsers(db, admin, 0, "pending")).rows.map((row) => row.id),
    ).toEqual(["user"]);

    expect(await approveUserRole(db, admin, { userId: "user", role: "maintainer" })).toEqual({
      data: { userId: "user", role: "maintainer" },
      error: null,
    });
    expect(serviceData(await inspectUsers(db, admin)).counts).toEqual({
      all: 3,
      pending: 0,
      approved: 3,
    });

    await approveUserRole(db, admin, { userId: "user", role: "user" });
    expect(serviceData(await inspectUsers(db, admin)).counts).toEqual({
      all: 3,
      pending: 1,
      approved: 2,
    });

    // Unknown persisted roles fail closed as pending.
    await db.update(authUser).set({ role: "unknown" }).where(eq(authUser.id, "user"));
    expect(
      serviceData(await inspectUsers(db, admin, 0, "pending")).rows.map((row) => row.id),
    ).toEqual(["user"]);
  } finally {
    await platform.dispose();
  }
}, 30_000);
