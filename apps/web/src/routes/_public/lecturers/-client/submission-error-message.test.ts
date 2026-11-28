import { expect, test } from "bun:test";
import { REVIEW_ERRORS } from "../-shared/errors";
import { likeErrorMessage, submissionErrorMessage } from "./submission-error-message";

const text = (key: string, values?: Record<string, unknown>) =>
  key.replace("{{time}}", String(values?.time));
const resetAt = new Date(2026, 10, 25, 14, 0).getTime();

test("a rate-limited submission or like formats the server reset time in local time", () => {
  const error = { code: REVIEW_ERRORS.RATE_LIMIT, resetAt };
  expect(submissionErrorMessage(error, text)).toBe("Submission limit reached. Resets at 14:00.");
  expect(likeErrorMessage(error, text)).toBe("Like limit reached. Resets at 14:00.");
});

test("review failure codes map to their messages", () => {
  expect(submissionErrorMessage({ code: REVIEW_ERRORS.CAPTCHA }, text)).toBe(
    "Security verification failed. Please try again.",
  );
  expect(submissionErrorMessage({ code: REVIEW_ERRORS.UNAVAILABLE }, text)).toBe(
    "Reviews are temporarily unavailable. Please try again later.",
  );
});

test("anything that is not a review failure gets the generic message", () => {
  for (const error of [new Error("INTERNAL_ERROR"), null, { code: 1 }, "x"]) {
    expect(submissionErrorMessage(error, text)).toBe(
      "Could not confirm submission. Refresh the page before trying again.",
    );
    expect(likeErrorMessage(error, text)).toBe("Could not update like. Please try again.");
  }
});
