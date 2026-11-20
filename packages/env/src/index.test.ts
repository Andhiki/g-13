import { expect, it } from "bun:test";
import { parseAuthEnvironment, parseSubmissionEnvironment } from "./index";

it("fails closed without complete server-only OAuth configuration", () => {
  const config = {
    BETTER_AUTH_SECRET: crypto.randomUUID(),
    BETTER_AUTH_URL: "https://example.test",
    GITHUB_CLIENT_ID: "test-only",
    GITHUB_CLIENT_SECRET: "test-only",
  };
  expect(parseAuthEnvironment(config)).toEqual({
    ...config,
    BETTER_AUTH_ALLOWED_HOSTS: ["example.test"],
    ADMIN_EMAILS: [],
  });
  expect(() => parseAuthEnvironment({})).toThrow();
  expect(() => parseAuthEnvironment({ ...config, BETTER_AUTH_SECRET: "short" })).toThrow();
  expect(() => parseAuthEnvironment({ ...config, GITHUB_CLIENT_SECRET: "" })).toThrow();
  expect(() =>
    parseAuthEnvironment({ ...config, BETTER_AUTH_URL: "http://example.test" }),
  ).toThrow();
  expect(() =>
    parseAuthEnvironment({ ...config, BETTER_AUTH_URL: "http://localhost:5173" }),
  ).not.toThrow();
});

it("parses additional auth hosts for multi-domain deployments", () => {
  const config = {
    BETTER_AUTH_SECRET: crypto.randomUUID(),
    BETTER_AUTH_URL: "https://csugm.omahti.com",
    BETTER_AUTH_ALLOWED_HOSTS: "csugm.omahti.com, csugm.andhiki.tech",
    GITHUB_CLIENT_ID: "test-only",
    GITHUB_CLIENT_SECRET: "test-only",
  };
  expect(parseAuthEnvironment(config).BETTER_AUTH_ALLOWED_HOSTS).toEqual([
    "csugm.omahti.com",
    "csugm.andhiki.tech",
  ]);
  expect(() =>
    parseAuthEnvironment({ ...config, BETTER_AUTH_ALLOWED_HOSTS: "https://example.test" }),
  ).toThrow();
});

it("requires a server rate-limit secret of at least 32 characters", () => {
  expect(() => parseSubmissionEnvironment({})).toThrow();
  expect(() => parseSubmissionEnvironment({ REVIEW_RATE_LIMIT_SECRET: "short" })).toThrow();
  expect(() => parseSubmissionEnvironment(null)).toThrow();
  expect(() => parseSubmissionEnvironment({ REVIEW_RATE_LIMIT_SECRET: 32 })).toThrow();
  expect(
    parseSubmissionEnvironment({ REVIEW_RATE_LIMIT_SECRET: "s".repeat(32) })
      .REVIEW_RATE_LIMIT_SECRET,
  ).toHaveLength(32);
});

it("parses the bootstrap admin allowlist", () => {
  const config = {
    BETTER_AUTH_SECRET: crypto.randomUUID(),
    BETTER_AUTH_URL: "https://csugm.omahti.com",
    ADMIN_EMAILS: "AndhikiAndre@Gmail.com, second@example.test",
    GITHUB_CLIENT_ID: "test-only",
    GITHUB_CLIENT_SECRET: "test-only",
  };
  expect(parseAuthEnvironment(config).ADMIN_EMAILS).toEqual([
    "andhikiandre@gmail.com",
    "second@example.test",
  ]);
  expect(() => parseAuthEnvironment({ ...config, ADMIN_EMAILS: "not-an-email" })).toThrow();
});
