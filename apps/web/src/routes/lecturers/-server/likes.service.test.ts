import { expect, it } from "bun:test";
import { createDatabase, courses, lecturers, reviews } from "@g13/db";
import { setReviewLike } from "./likes.service";
import { REVIEW_ERRORS } from "../-shared/errors";
import { getBrowserReviewLikes } from "./repository";
import { getLecturerDetail } from "./read.service";
import { browserLikesInputSchema, reviewLikeInputSchema } from "../-shared/schemas";
import { createTestPlatformProxy } from "@/test/database";

it("likes and unlikes visible reviews once per browser and limits abuse", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await db.insert(lecturers).values({ id: "p", name: "Lecturer" });
    await db.insert(courses).values({ id: "c", code: "CS", nameId: "Data", nameEn: "Data" });
    await db.insert(reviews).values([
      {
        id: "r",
        lecturerId: "p",
        courseId: "c",
        termLabel: "2026",
        authorName: "Anonymous",
        clarity: 5,
        support: 5,
        organization: 5,
        body: "Helpful",
      },
      {
        id: "hidden",
        lecturerId: "p",
        courseId: "c",
        termLabel: "2026",
        authorName: "Anonymous",
        clarity: 5,
        support: 5,
        organization: 5,
        body: "Hidden",
        status: "hidden",
      },
    ]);
    const browserId = browserLikesInputSchema.parse({ browserId: crypto.randomUUID() }).browserId;
    expect(await getBrowserReviewLikes(db, browserId)).toEqual([]);
    const input = reviewLikeInputSchema.parse({ reviewId: "r", browserId, liked: true });
    const context = {
      ip: "192.0.2.1",
      secret: "test-secret-".repeat(4),
      now: 3_600_000,
    };
    expect(await setReviewLike(db, { ...input, reviewId: "hidden" }, context)).toEqual({
      data: null,
      error: REVIEW_ERRORS.INVALID,
    });
    expect(await setReviewLike(db, input, { ...context, ip: null })).toEqual({
      data: null,
      error: REVIEW_ERRORS.UNAVAILABLE,
    });
    expect(await setReviewLike(db, input, context)).toEqual({
      data: { reviewId: "r", liked: true },
      error: null,
    });
    expect(await setReviewLike(db, input, context)).toEqual({
      data: { reviewId: "r", liked: true },
      error: null,
    });
    expect(await getBrowserReviewLikes(db, browserId)).toEqual(["r"]);
    expect((await getLecturerDetail(db, "p"))?.reviews[0].likeCount).toBe(1);
    await db.$client.prepare("UPDATE reviews SET status = 'hidden' WHERE id = 'r'").run();
    expect(await getBrowserReviewLikes(db, browserId)).toEqual([]);
    await db.$client
      .prepare("UPDATE reviews SET status = 'published', deleted_at = 1 WHERE id = 'r'")
      .run();
    expect(await getBrowserReviewLikes(db, browserId)).toEqual([]);
    await db.$client.prepare("UPDATE reviews SET deleted_at = NULL WHERE id = 'r'").run();
    expect(await getBrowserReviewLikes(db, browserId)).toEqual(["r"]);
    expect(await setReviewLike(db, { ...input, liked: false }, context)).toEqual({
      data: { reviewId: "r", liked: false },
      error: null,
    });
    expect(await getBrowserReviewLikes(db, browserId)).toEqual([]);
    expect((await getLecturerDetail(db, "p"))?.reviews[0].likeCount).toBe(0);
    for (let i = 0; i < 57; i++)
      expect(await setReviewLike(db, input, context)).toEqual({
        data: { reviewId: "r", liked: true },
        error: null,
      });
    expect(await setReviewLike(db, input, context)).toEqual({
      data: null,
      error: REVIEW_ERRORS.RATE_LIMIT,
    });
    expect(
      JSON.stringify(await platform.env.DB.prepare("SELECT * FROM review_submission_limits").all()),
    ).not.toContain(context.ip);
  } finally {
    await platform.dispose();
  }
}, 30_000);
