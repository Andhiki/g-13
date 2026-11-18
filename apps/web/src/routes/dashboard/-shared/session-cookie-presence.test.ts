import { expect, it } from "bun:test";
import { getSessionCookie } from "better-auth/cookies";

it("detects Better Auth session-cookie presence without initializing auth or the database", () => {
  expect(Boolean(getSessionCookie(new Headers()))).toBe(false);
  expect(
    Boolean(getSessionCookie(new Headers({ cookie: "better-auth.session_token=fixture" }))),
  ).toBe(true);
  expect(
    Boolean(
      getSessionCookie(new Headers({ cookie: "__Secure-better-auth.session_token=fixture" })),
    ),
  ).toBe(true);
});
