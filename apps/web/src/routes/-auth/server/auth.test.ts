import { expect, it, spyOn } from "bun:test";
import { z } from "zod";
import { createAuth } from "@g13/auth/server";
import { authRateLimits, authSession, authUser, createDatabase } from "@g13/db";
import { eq } from "drizzle-orm";
import { createTestPlatformProxy } from "@/test/database";

it("creates only unprivileged GitHub accounts and rejects forged OAuth state", async () => {
  const platform = await createTestPlatformProxy();
  let githubId = 12345;
  let githubEmail = "github@example.test";
  const realFetch = globalThis.fetch;
  const fetchFixture = Object.assign(
    async (...[input, init]: Parameters<typeof fetch>) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url === "https://github.com/login/oauth/access_token") {
        return Response.json({
          access_token: "oauth-integration-fixture",
          token_type: "bearer",
          scope: "read:user,user:email",
        });
      }
      if (url === "https://api.github.com/user") {
        return Response.json({
          id: githubId,
          login: "integration-fixture",
          name: "Integration Fixture",
          email: githubEmail,
          avatar_url: null,
        });
      }
      if (url === "https://api.github.com/user/emails") {
        return Response.json([{ email: githubEmail, primary: true, verified: true }]);
      }
      return realFetch(input, init);
    },
    { preconnect: realFetch.preconnect },
  );
  const mockFetch = spyOn(globalThis, "fetch").mockImplementation(fetchFixture);
  try {
    const db = createDatabase(platform.env.DB);
    const auth = createAuth(db, {
      secret: crypto.randomUUID(),
      baseURL: "http://localhost:3000",
      githubClientId: "integration-test-only",
      githubClientSecret: "integration-test-only",
    });
    const signIn = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/social", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          "cf-connecting-ip": "192.0.2.1",
        },
        body: JSON.stringify({
          provider: "github",
          callbackURL: "/admin",
          additionalData: { role: "admin" },
        }),
      }),
    );
    expect(signIn.status).toBe(200);
    const result = z.object({ url: z.string() }).parse(await signIn.json());
    const state = new URL(result.url).searchParams.get("state");
    expect(state).toBeTruthy();
    const cookies = signIn.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; ");
    const forged = await auth.handler(
      new Request("http://localhost:3000/api/auth/callback/github?code=fixture&state=forged", {
        headers: { cookie: cookies, "cf-connecting-ip": "192.0.2.1" },
      }),
    );
    expect(forged.headers.get("location")).toContain("error=state_mismatch");
    expect(await db.select().from(authUser)).toEqual([]);
    const callback = await auth.handler(
      new Request(
        `http://localhost:3000/api/auth/callback/github?code=fixture&state=${encodeURIComponent(state ?? "")}`,
        {
          headers: { cookie: cookies, "cf-connecting-ip": "192.0.2.1" },
        },
      ),
    );
    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).toBe("/admin");
    const [user] = await db.select().from(authUser);
    expect(user.role).toBe("user");
    expect(user.emailVerified).toBe(true);
    const sessionCookies = callback.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; ");
    const headers = new Headers({ cookie: sessionCookies, origin: "http://localhost:3000" });
    expect((await auth.api.getSession({ headers }))?.user.role).toBe("user");
    await auth.handler(
      new Request("http://localhost:3000/api/auth/update-user", {
        method: "POST",
        headers: { ...Object.fromEntries(headers), "content-type": "application/json" },
        body: JSON.stringify({ role: "admin" }),
      }),
    );
    expect((await auth.api.getSession({ headers }))?.user.role).toBe("user");
    const untrusted = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/social", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://untrusted.example.test",
          cookie: sessionCookies,
        },
        body: JSON.stringify({ provider: "github", callbackURL: "/admin" }),
      }),
    );
    expect(untrusted.status).toBe(403);
    const now = new Date();
    await db.insert(authUser).values({
      id: "existing-admin",
      name: "Existing Admin",
      email: "existing@example.test",
      emailVerified: true,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });
    githubId = 54321;
    githubEmail = "existing@example.test";
    const linkingAttempt = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/social", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          "cf-connecting-ip": "192.0.2.3",
        },
        body: JSON.stringify({ provider: "github", callbackURL: "/admin" }),
      }),
    );
    const linkingData = z.object({ url: z.string() }).parse(await linkingAttempt.json());
    const linkingState = new URL(linkingData.url).searchParams.get("state");
    const linkingCookies = linkingAttempt.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; ");
    const linkingCallback = await auth.handler(
      new Request(
        `http://localhost:3000/api/auth/callback/github?code=fixture&state=${encodeURIComponent(linkingState ?? "")}`,
        {
          headers: { cookie: linkingCookies, "cf-connecting-ip": "192.0.2.3" },
        },
      ),
    );
    expect(linkingCallback.headers.get("location")).toContain("error=account_not_linked");
    expect(
      await db.select().from(authSession).where(eq(authSession.userId, "existing-admin")),
    ).toEqual([]);
    for (let attempt = 0; attempt < 11; attempt++) {
      const limited = await auth.handler(
        new Request("http://localhost:3000/api/auth/sign-in/social", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            "cf-connecting-ip": "192.0.2.2",
          },
          body: JSON.stringify({ provider: "github", callbackURL: "/admin" }),
        }),
      );
      expect(limited.status).toBe(attempt < 10 ? 200 : 429);
    }
    const limits = await db.select().from(authRateLimits);
    expect(limits.length).toBeGreaterThan(0);
    expect(limits.every((row) => /^[a-f0-9]{64}$/.test(row.key))).toBe(true);
  } finally {
    mockFetch.mockRestore();
    await platform.dispose();
  }
}, 30_000);
