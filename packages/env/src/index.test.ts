import { expect, it } from "bun:test";
import { parseAuthEnvironment, parseSubmissionEnvironment } from "./index";

it("fails closed without complete server-only OAuth configuration", () => {
  const config = {
    BETTER_AUTH_SECRET: crypto.randomUUID(),
    BETTER_AUTH_URL: "https://example.test",
    GITHUB_CLIENT_ID: "test-only",
    GITHUB_CLIENT_SECRET: "test-only",
  };
  expect(parseAuthEnvironment(config)).toEqual(config);
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
