import { expect, it } from "bun:test";
import { createAuth } from "@g13/auth/server";
import { authSession, authUser, createDatabase } from "@g13/db";
import { eq } from "drizzle-orm";
import { createTestPlatformProxy } from "@/test/database";
import { USER_ERRORS, type UserOperationResult } from "../-shared/errors";
import { approveUserRole, inspectUsers } from "./service";

function serviceData<T>(result: UserOperationResult<T>): T {
  if (result.error !== null) throw new Error(result.error);
  return result.data;
}

it("enforces account approval policy with uncached D1-backed sessions", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const secret = crypto.randomUUID();
    const auth = createAuth(db, {
      secret,
      baseURL: "http://localhost:3000",
      githubClientId: "integration-test-only",
      githubClientSecret: "integration-test-only",
    });
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
    const maintainer = { id: "maintainer", role: "maintainer" };
    const [userBefore] = await db
      .select({ role: authUser.role })
      .from(authUser)
      .where(eq(authUser.id, "user"));
    const [adminBefore] = await db
      .select({ role: authUser.role })
      .from(authUser)
      .where(eq(authUser.id, "admin"));
    for (const role of [undefined, null, "user", "moderator", "admin,user"]) {
      const actor = { id: "user", role };
      expect(await inspectUsers(db, actor)).toEqual({ data: null, error: USER_ERRORS.FORBIDDEN });
      expect(await approveUserRole(db, actor, { userId: "user", role: "admin" })).toEqual({
        data: null,
        error: USER_ERRORS.FORBIDDEN,
      });
    }
    expect(await inspectUsers(db, maintainer)).toEqual({
      data: null,
      error: USER_ERRORS.FORBIDDEN,
    });
    expect(await approveUserRole(db, maintainer, { userId: "user", role: "admin" })).toEqual({
      data: null,
      error: USER_ERRORS.FORBIDDEN,
    });
    expect(await approveUserRole(db, admin, { userId: "admin", role: "user" })).toEqual({
      data: null,
      error: USER_ERRORS.FORBIDDEN,
    });
    expect(
      await db.select({ role: authUser.role }).from(authUser).where(eq(authUser.id, "user")),
    ).toEqual([userBefore]);
    expect(
      await db.select({ role: authUser.role }).from(authUser).where(eq(authUser.id, "admin")),
    ).toEqual([adminBefore]);
    expect(await approveUserRole(db, admin, { userId: "missing", role: "admin" })).toEqual({
      data: null,
      error: USER_ERRORS.USER_NOT_FOUND,
    });
    const users = serviceData(await inspectUsers(db, admin));
    expect(users.rows).toHaveLength(3);
    expect(users.counts).toEqual({ all: 3, pending: 1, approved: 2 });
    expect(
      serviceData(await inspectUsers(db, admin, 0, "pending")).rows.map((user) => user.id),
    ).toEqual(["user"]);
    expect(serviceData(await inspectUsers(db, admin, 0, "approved")).rows).toHaveLength(2);
    expect(serviceData(await inspectUsers(db, admin, 1, "pending")).rows).toEqual([]);
    expect(await approveUserRole(db, admin, { userId: "user", role: "maintainer" })).toEqual({
      data: { userId: "user", role: "maintainer" },
      error: null,
    });

    expect(serviceData(await inspectUsers(db, admin, 0, "pending")).rows).toEqual([]);
    expect(serviceData(await inspectUsers(db, admin)).counts).toEqual({
      all: 3,
      pending: 0,
      approved: 3,
    });
    const context = await auth.$context;
    const session = await context.internalAdapter.createSession("user");
    expect(session).toBeTruthy();
    expect(session.ipAddress).toBeNull();
    expect(session.userAgent).toBeNull();
    const signingKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      signingKey,
      new TextEncoder().encode(session.token),
    );
    const signedToken = `${session.token}.${Buffer.from(signature).toString("base64")}`;
    const headers = new Headers({
      cookie: `${context.authCookies.sessionToken.name}=${encodeURIComponent(signedToken)}`,
    });
    const lookup = () => auth.api.getSession({ headers, query: { disableCookieCache: true } });
    expect((await lookup())?.user.role).toBe("maintainer");
    await approveUserRole(db, admin, { userId: "user", role: "user" });
    expect((await lookup())?.user.role).toBe("user");
    expect(serviceData(await inspectUsers(db, admin)).counts).toEqual({
      all: 3,
      pending: 1,
      approved: 2,
    });
    await db.update(authUser).set({ role: "unknown" }).where(eq(authUser.id, "user"));
    expect(
      serviceData(await inspectUsers(db, admin, 0, "pending")).rows.map((user) => user.id),
    ).toEqual(["user"]);
    const unknownRoleSession = await lookup();
    expect(unknownRoleSession?.user.role).toBe("unknown");
    await db
      .update(authSession)
      .set({ expiresAt: new Date(0) })
      .where(eq(authSession.id, session.id));
    expect(await lookup()).toBeNull();
    const active = await context.internalAdapter.createSession("user");
    const activeSignature = await crypto.subtle.sign(
      "HMAC",
      signingKey,
      new TextEncoder().encode(active.token),
    );
    headers.set(
      "cookie",
      `${context.authCookies.sessionToken.name}=${encodeURIComponent(`${active.token}.${Buffer.from(activeSignature).toString("base64")}`)}`,
    );
    expect((await lookup())?.user.id).toBe("user");
    await db.delete(authSession).where(eq(authSession.id, active.id));
    expect(await lookup()).toBeNull();
    headers.set("cookie", `${context.authCookies.sessionToken.name}=forged.invalid`);
    expect(await lookup()).toBeNull();
    expect(await auth.api.getSession({ headers: new Headers() })).toBeNull();
    const passwordResponse = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({
          name: "Attacker",
          email: "attacker@example.test",
          password: "not-a-real-password",
          role: "admin",
        }),
      }),
    );
    expect(passwordResponse.ok).toBe(false);
  } finally {
    await platform.dispose();
  }
}, 30_000);
