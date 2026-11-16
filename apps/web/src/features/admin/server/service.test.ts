import { fileURLToPath } from "node:url";
import { expect, it } from "bun:test";
import { getPlatformProxy } from "wrangler";
import { createAuth } from "@g13/auth/server";
import { authSession, authUser, courses, createDatabase, lecturers, reviews } from "@g13/db";
import { eq } from "drizzle-orm";
import { approveUserRole, inspectReviews, inspectUsers, moderateLecturerReview } from "./service";

it("enforces moderation and approval policy with uncached D1-backed sessions", async () => {
  const platform = await getPlatformProxy<{ DB: D1Database }>({
    configPath: fileURLToPath(new URL("../../../../wrangler.jsonc", import.meta.url)),
    persist: false,
  });
  try {
    const schema = await Bun.file(
      new URL("../../../../../../packages/db/schema.sql", import.meta.url),
    ).text();
    for (const statement of schema
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)) {
      await platform.env.DB.prepare(statement).run();
    }
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
    await db.insert(lecturers).values({ id: "lecturer", name: "Lecturer" });
    await db.insert(courses).values({ id: "course", code: "CS", nameId: "Data", nameEn: "Data" });
    await db.insert(reviews).values({
      id: "review",
      lecturerId: "lecturer",
      courseId: "course",
      termLabel: "2026",
      authorName: "Anonymous",
      clarity: 3,
      support: 3,
      organization: 3,
      body: "Feedback",
    });
    const admin = { id: "admin", role: "admin" };
    const maintainer = { id: "maintainer", role: "maintainer" };
    for (const role of [undefined, null, "user", "moderator", "admin,user"]) {
      const actor = { id: "user", role };
      await expect(inspectReviews(db, actor)).rejects.toThrow("Access denied");
      await expect(
        moderateLecturerReview(db, actor, { reviewId: "review", action: "hide" }),
      ).rejects.toThrow("Access denied");
      await expect(inspectUsers(db, actor)).rejects.toThrow("Access denied");
      await expect(approveUserRole(db, actor, { userId: "user", role: "admin" })).rejects.toThrow(
        "Access denied",
      );
    }
    expect((await inspectReviews(db, admin)).rows).toHaveLength(1);
    expect((await inspectReviews(db, maintainer)).rows).toHaveLength(1);
    expect((await inspectReviews(db, admin)).counts).toEqual({
      all: 1,
      published: 1,
      hidden: 0,
      deleted: 0,
    });
    expect((await inspectReviews(db, admin, 0, "hidden")).rows).toEqual([]);
    expect((await inspectReviews(db, admin, 1, "published")).rows).toEqual([]);
    await expect(inspectUsers(db, maintainer)).rejects.toThrow("Access denied");
    await expect(
      approveUserRole(db, maintainer, { userId: "user", role: "admin" }),
    ).rejects.toThrow("Access denied");
    await expect(approveUserRole(db, admin, { userId: "admin", role: "user" })).rejects.toThrow(
      "Access denied",
    );
    expect((await inspectUsers(db, admin)).rows).toHaveLength(3);
    expect((await inspectUsers(db, admin)).counts).toEqual({ all: 3, pending: 1, approved: 2 });
    expect((await inspectUsers(db, admin, 0, "pending")).rows.map((user) => user.id)).toEqual([
      "user",
    ]);
    expect((await inspectUsers(db, admin, 0, "approved")).rows).toHaveLength(2);
    expect((await inspectUsers(db, admin, 1, "pending")).rows).toEqual([]);
    expect(await approveUserRole(db, admin, { userId: "user", role: "maintainer" })).toEqual({
      ok: true,
    });
    expect(
      await moderateLecturerReview(db, maintainer, { reviewId: "review", action: "hide" }),
    ).toEqual({ ok: true });

    expect((await inspectReviews(db, admin, 0, "published")).rows).toEqual([]);
    expect((await inspectReviews(db, admin, 0, "hidden")).rows).toHaveLength(1);
    expect((await inspectReviews(db, admin)).counts).toEqual({
      all: 1,
      published: 0,
      hidden: 1,
      deleted: 0,
    });
    await moderateLecturerReview(db, admin, { reviewId: "review", action: "delete" });
    expect((await inspectReviews(db, admin, 0, "hidden")).rows).toEqual([]);
    expect((await inspectReviews(db, admin, 0, "deleted")).rows).toHaveLength(1);
    expect((await inspectReviews(db, admin)).counts).toEqual({
      all: 1,
      published: 0,
      hidden: 0,
      deleted: 1,
    });

    expect((await inspectUsers(db, admin, 0, "pending")).rows).toEqual([]);
    expect((await inspectUsers(db, admin)).counts).toEqual({ all: 3, pending: 0, approved: 3 });
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
    expect((await inspectUsers(db, admin)).counts).toEqual({ all: 3, pending: 1, approved: 2 });
    await db.update(authUser).set({ role: "unknown" }).where(eq(authUser.id, "user"));
    expect((await inspectUsers(db, admin, 0, "pending")).rows.map((user) => user.id)).toEqual([
      "user",
    ]);
    const unknownRoleSession = await lookup();
    expect(unknownRoleSession?.user.role).toBe("unknown");
    await expect(
      inspectReviews(db, { id: "user", role: unknownRoleSession?.user.role }),
    ).rejects.toThrow("Access denied");
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
