import { expect, test } from "bun:test";
import { REVIEW_ERRORS } from "../-shared/errors";
import { submissionErrorMessage } from "./submission-error-message";

const text = (key: string, values?: Record<string, unknown>) =>
  key.replace("{{time}}", String(values?.time));

test("a rate-limited submission formats the server reset time in local time", () => {
  const now = new Date(2026, 10, 25, 10, 15).getTime();
  const resetAt = new Date(2026, 10, 25, 14, 0).getTime();
  const error = { code: REVIEW_ERRORS.RATE_LIMIT, resetAt };
  expect(submissionErrorMessage(error, text, now)).toBe(
    "Submission limit reached. Resets at 14:00.",
  );
});

test("a rate-limited submission without a timestamp falls back to the browser clock", () => {
  const now = new Date(2026, 10, 25, 10, 0).getTime();
  const error = new Error(REVIEW_ERRORS.RATE_LIMIT);
  const reset = new Date((Math.floor(now / 3_600_000) + 1) * 3_600_000);
  const localTime = [reset.getHours(), reset.getMinutes()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
  expect(submissionErrorMessage(error, text, now)).toBe(
    `Submission limit reached. Resets at ${localTime}.`,
  );
});
