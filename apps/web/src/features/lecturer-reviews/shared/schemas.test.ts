import { expect, it } from "bun:test";
import {
  browserLikesInputSchema,
  lecturerDetailInputSchema,
  publishReviewInputSchema,
  reviewLikeInputSchema,
  validateRpcInput,
} from "./schemas";

const browserId = "26f6ff50-0e4a-4db4-9a33-b03440c62af0";
const submission = {
  lecturerId: "lecturer-1",
  courseId: "course-1",
  termLabel: "2026/2027 Ganjil",
  anonymous: false,
  authorName: " Student ",
  clarity: 5,
  support: 3,
  organization: 1,
  body: " Helpful examples ",
};

it("validates every lecturer RPC payload at runtime", () => {
  expect(validateRpcInput(lecturerDetailInputSchema, { lecturerId: "lecturer-1" })).toEqual({
    valid: true,
    data: { lecturerId: "lecturer-1" },
  });
  expect(validateRpcInput(lecturerDetailInputSchema, null)).toEqual({ valid: false });
  expect(validateRpcInput(lecturerDetailInputSchema, { lecturerId: 12 })).toEqual({ valid: false });

  expect(validateRpcInput(browserLikesInputSchema, { browserId })).toMatchObject({ valid: true });
  expect(validateRpcInput(browserLikesInputSchema, null)).toEqual({ valid: false });
  expect(validateRpcInput(browserLikesInputSchema, { browserId: 12 })).toEqual({ valid: false });
  expect(validateRpcInput(browserLikesInputSchema, { browserId: "not-a-uuid" })).toEqual({
    valid: false,
  });

  expect(
    validateRpcInput(reviewLikeInputSchema, { reviewId: "review-1", browserId, liked: true }),
  ).toMatchObject({ valid: true });
  for (const invalid of [
    null,
    { reviewId: 5, browserId, liked: true },
    { reviewId: "review-1", browserId: null, liked: true },
    { reviewId: "review-1", browserId, liked: "true" },
  ]) {
    expect(validateRpcInput(reviewLikeInputSchema, invalid)).toEqual({ valid: false });
  }

  expect(validateRpcInput(publishReviewInputSchema, submission)).toEqual({
    valid: true,
    data: {
      ...submission,
      authorName: "Student",
      body: "Helpful examples",
      termLabel: "2026/2027 Ganjil",
    },
  });
  for (const invalid of [
    null,
    { ...submission, clarity: "5" },
    { ...submission, anonymous: "false" },
    { ...submission, courseId: 12 },
    { ...submission, authorName: 7 },
    { ...submission, body: " " },
  ]) {
    expect(validateRpcInput(publishReviewInputSchema, invalid)).toEqual({ valid: false });
  }
});
