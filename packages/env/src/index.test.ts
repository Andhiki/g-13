import { describe, expect, it } from "bun:test";
import { isFeatureEnabled, parseRuntimeEnvironment } from "./index";

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
