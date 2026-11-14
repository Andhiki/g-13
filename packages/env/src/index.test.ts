import { expect, it } from "bun:test";
import { parseSubmissionEnvironment } from "./index";

it("requires a server rate-limit secret of at least 32 characters", () => {
  expect(() => parseSubmissionEnvironment({})).toThrow();
  expect(() => parseSubmissionEnvironment({ REVIEW_RATE_LIMIT_SECRET: "short" })).toThrow();
  expect(
    parseSubmissionEnvironment({ REVIEW_RATE_LIMIT_SECRET: "s".repeat(32) })
      .REVIEW_RATE_LIMIT_SECRET,
  ).toHaveLength(32);
});
