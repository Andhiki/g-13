import { expect, test } from "bun:test";
import { serverAdapters } from "@/server/adapters";
import { verifyTurnstileToken } from "@/routes/_public/lecturers/-server/turnstile";
import { e2eAdapters, e2eAlumniOutageHeader, e2eCaptcha, e2eClientIp } from ".";

test("non-e2e builds use the production adapters", () => {
  expect(serverAdapters).not.toBe(e2eAdapters);
  expect(serverAdapters.verifyCaptcha).toBe(verifyTurnstileToken);
  expect(serverAdapters.alumni.outage(new Request("https://x.test"))).toBe(false);
});

test("e2e adapters accept only the fixture captcha pair and pin the client IP", async () => {
  const verify = (token: string) => e2eAdapters.verifyCaptcha({ secret: e2eCaptcha.secret, token });
  expect(await verify(e2eCaptcha.verifiedToken)).toBe(true);
  expect(await verify("e2e-rejected")).toBe(false);
  expect(
    await e2eAdapters.verifyCaptcha({ secret: "other", token: e2eCaptcha.verifiedToken }),
  ).toBe(false);
  expect(e2eAdapters.clientIp(new Request("https://x.test"))).toBe(e2eClientIp);
  expect(await e2eAdapters.reviewModeration("")({ body: "any text" })).toBe("clear");
});

test("e2e alumni adapter serves fixtures and simulates an outage on request", async () => {
  expect(e2eAdapters.alumni.token()).toBeDefined();
  expect((await e2eAdapters.alumni.fetchPages("t"))[0].data).toHaveLength(3);
  const outage = new Request("https://x.test", { headers: { [e2eAlumniOutageHeader]: "1" } });
  expect(e2eAdapters.alumni.outage(outage)).toBe(true);
  expect(e2eAdapters.alumni.outage(new Request("https://x.test"))).toBe(false);
});
