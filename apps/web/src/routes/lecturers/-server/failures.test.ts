import { expect, it, spyOn } from "bun:test";
import { createServerEntry } from "@tanstack/react-start/server";
import { REVIEW_ERRORS, type ReviewOperationError } from "../-shared/errors";
import { rejectReviewLikeOperation, rejectSubmissionOperation } from "./failures";

const reviewErrorCases: {
  operation: string;
  error: ReviewOperationError;
  status: number;
  reject: (error: ReviewOperationError) => never;
}[] = [
  {
    operation: "submission",
    error: REVIEW_ERRORS.INVALID,
    status: 400,
    reject: rejectSubmissionOperation,
  },
  {
    operation: "submission",
    error: REVIEW_ERRORS.UNAVAILABLE,
    status: 503,
    reject: rejectSubmissionOperation,
  },
  {
    operation: "submission",
    error: REVIEW_ERRORS.RATE_LIMIT,
    status: 429,
    reject: rejectSubmissionOperation,
  },
  {
    operation: "like",
    error: REVIEW_ERRORS.INVALID,
    status: 404,
    reject: rejectReviewLikeOperation,
  },
  {
    operation: "like",
    error: REVIEW_ERRORS.UNAVAILABLE,
    status: 503,
    reject: rejectReviewLikeOperation,
  },
  {
    operation: "like",
    error: REVIEW_ERRORS.RATE_LIMIT,
    status: 429,
    reject: rejectReviewLikeOperation,
  },
];

for (const { operation, error, status, reject } of reviewErrorCases) {
  it(`rejects ${operation} ${error} with HTTP ${status}`, async () => {
    const consoleError = spyOn(console, "error").mockImplementation(() => {});
    try {
      const entry = createServerEntry({
        fetch: async () => {
          try {
            return reject(error);
          } catch (thrown: unknown) {
            expect(thrown).toBeInstanceOf(Error);
            expect(thrown).toHaveProperty("message", error);
            throw thrown;
          }
        },
      });
      const response = await entry.fetch(new Request("http://localhost"), {});
      expect(response.status).toBe(status);
    } finally {
      consoleError.mockRestore();
    }
  });
}
