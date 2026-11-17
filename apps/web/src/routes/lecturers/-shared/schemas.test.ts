import { expect, it } from "bun:test";
import {
  browserLikesInputSchema,
  lecturerDetailInputSchema,
  publishReviewInputSchema,
  reviewLikeInputSchema,
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
  expect(lecturerDetailInputSchema.parse({ lecturerId: "lecturer-1" })).toEqual({
    lecturerId: "lecturer-1",
  });
  expect(lecturerDetailInputSchema.safeParse(null).success).toBe(false);
  expect(lecturerDetailInputSchema.safeParse({ lecturerId: 12 }).success).toBe(false);

  expect(browserLikesInputSchema.parse({ browserId })).toEqual({ browserId });
  expect(browserLikesInputSchema.safeParse(null).success).toBe(false);
  expect(browserLikesInputSchema.safeParse({ browserId: 12 }).success).toBe(false);
  expect(browserLikesInputSchema.safeParse({ browserId: "not-a-uuid" }).success).toBe(false);

  expect(reviewLikeInputSchema.parse({ reviewId: "review-1", browserId, liked: true })).toEqual({
    reviewId: "review-1",
    browserId,
    liked: true,
  });
  for (const invalid of [
    null,
    { reviewId: 5, browserId, liked: true },
    { reviewId: "review-1", browserId: null, liked: true },
    { reviewId: "review-1", browserId, liked: "true" },
  ]) {
    expect(reviewLikeInputSchema.safeParse(invalid).success).toBe(false);
  }

  expect(publishReviewInputSchema.parse(submission)).toEqual({
    ...submission,
    authorName: "Student",
    body: "Helpful examples",
  });
  for (const invalid of [
    null,
    { ...submission, clarity: "5" },
    { ...submission, anonymous: "false" },
    { ...submission, courseId: 12 },
    { ...submission, authorName: 7 },
    { ...submission, body: " " },
  ]) {
    expect(publishReviewInputSchema.safeParse(invalid).success).toBe(false);
  }

  for (const authorName of ["Remembered display name", 42, null]) {
    expect(
      publishReviewInputSchema.parse({ ...submission, anonymous: true, authorName }).authorName,
    ).toBe("");
  }
});
