import { describe, expect, it } from "bun:test";
import { isFeatureEnabled, parseRuntimeEnvironment, parseSubmissionEnvironment } from "./index";

describe("runtime feature flags", () => {
  it("defaults professor reviews to disabled", () => {
    expect(parseRuntimeEnvironment({}).features.professorReviews).toBe(false);
  });

  it("parses the configured flag", () => {
    const flags = parseRuntimeEnvironment({ PROFESSOR_REVIEWS_ENABLED: "true" }).features;
    expect(isFeatureEnabled(flags, "professorReviews")).toBe(true);
  });

  it("rejects values outside the typed flag contract", () => {
    expect(() => parseRuntimeEnvironment({ PROFESSOR_REVIEWS_ENABLED: "yes" })).toThrow();
  });
});

it("requires a server rate-limit secret of at least 32 characters", () => {
  expect(() => parseSubmissionEnvironment({})).toThrow();
  expect(() => parseSubmissionEnvironment({ REVIEW_RATE_LIMIT_SECRET: "short" })).toThrow();
  expect(
    parseSubmissionEnvironment({ REVIEW_RATE_LIMIT_SECRET: "s".repeat(32) })
      .REVIEW_RATE_LIMIT_SECRET,
  ).toHaveLength(32);
});
