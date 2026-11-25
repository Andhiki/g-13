import { expect, it } from "bun:test";
import { finalizeAuthResponse, prepareAuthRequest, resolveAuthOrigin } from "./auth-request";

const allowedHosts = ["csugm.omahti.com", "csugm.andhiki.tech"];

it("uses the browser origin when a proxy rewrote the request host", () => {
  const prepared = prepareAuthRequest(
    new Request("https://csugm.andhiki.tech/api/auth/sign-in/social", {
      method: "POST",
      headers: { origin: "https://csugm.omahti.com" },
    }),
    allowedHosts,
  );
  expect(prepared.origin).toBe("https://csugm.omahti.com");
  expect(prepared.request.url).toBe("https://csugm.andhiki.tech/api/auth/sign-in/social");
  expect(prepared.request.headers.get("x-forwarded-host")).toBe("csugm.omahti.com");
  expect(prepared.request.headers.get("x-forwarded-proto")).toBe("https");
});

it("recovers the browser origin from the callback cookie", () => {
  const prepared = prepareAuthRequest(
    new Request("https://csugm.andhiki.tech/api/auth/callback/github?code=fixture&state=fixture", {
      headers: {
        cookie: "g13-auth-origin=https%3A%2F%2Fcsugm.omahti.com; better-auth.state=fixture",
      },
    }),
    allowedHosts,
  );
  expect(prepared.origin).toBe("https://csugm.omahti.com");
  expect(prepared.request.headers.get("x-forwarded-host")).toBe("csugm.omahti.com");
});

it("ignores untrusted origins and strips spoofed proxy headers", () => {
  const prepared = prepareAuthRequest(
    new Request("https://csugm.andhiki.tech/api/auth/sign-in/social", {
      method: "POST",
      headers: {
        origin: "https://evil.example.test",
        "x-forwarded-host": "evil.example.test",
        "x-forwarded-proto": "https",
      },
    }),
    allowedHosts,
  );
  expect(prepared.origin).toBeNull();
  expect(prepared.request.headers.get("x-forwarded-host")).toBeNull();
  expect(prepared.request.headers.get("x-forwarded-proto")).toBeNull();
});

it("accepts an allowed wildcard host but rejects plain http outside loopback", () => {
  expect(
    resolveAuthOrigin(
      new Request("https://proxy.test/api/auth/sign-in/social", {
        headers: { origin: "https://preview.example.test" },
      }),
      ["*.example.test"],
    ),
  ).toBe("https://preview.example.test");
  expect(
    resolveAuthOrigin(
      new Request("https://proxy.test/api/auth/sign-in/social", {
        headers: { origin: "http://csugm.omahti.com" },
      }),
      allowedHosts,
    ),
  ).toBeNull();
});

it("remembers the origin for the callback and clears it afterwards", () => {
  const start = new Request("https://csugm.andhiki.tech/api/auth/sign-in/social", {
    method: "POST",
  });
  const startResponse = finalizeAuthResponse(
    start,
    new Response(null, { status: 200 }),
    "https://csugm.omahti.com",
  );
  expect(
    startResponse.headers
      .getSetCookie()
      .some((cookie) => cookie.startsWith("g13-auth-origin=https%3A%2F%2Fcsugm.omahti.com;")),
  ).toBe(true);

  const callback = new Request("https://csugm.andhiki.tech/api/auth/callback/github");
  const callbackResponse = finalizeAuthResponse(
    callback,
    new Response(null, { status: 302 }),
    "https://csugm.omahti.com",
  );
  expect(
    callbackResponse.headers
      .getSetCookie()
      .some((cookie) => cookie.startsWith("g13-auth-origin=;") && cookie.includes("Max-Age=0")),
  ).toBe(true);
});

it("leaves same-origin auth responses untouched", () => {
  const request = new Request("https://csugm.andhiki.tech/api/auth/sign-in/social", {
    method: "POST",
  });
  const response = new Response(null, { status: 200 });
  expect(finalizeAuthResponse(request, response, "https://csugm.andhiki.tech")).toBe(response);
  expect(finalizeAuthResponse(request, response, null)).toBe(response);
});
