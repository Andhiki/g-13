import { expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { courses } from "@g13/db/schema/courses";
import { lecturers } from "@g13/db/schema/lecturers";
import { reviews } from "@g13/db/schema/lecturer-reviews";
import { createTestPlatformProxy } from "@/test/database";
import { MODERATION_ERRORS, type ModerationOperationResult } from "../-shared/errors";
import { inspectReviews, moderateLecturerReview } from "./service";

function resultData<T>(result: ModerationOperationResult<T>): T {
  if (result.error !== null) throw new Error(result.error);
  return result.data;
}

it("returns moderation policy outcomes and preserves public review aggregates", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await db.insert(lecturers).values({ id: "lecturer", name: "Lecturer" });
    await db.insert(courses).values({ id: "course", code: "CS", nameId: "Data", nameEn: "Data" });
    await db.insert(reviews).values({
      id: "review",
      lecturerId: "lecturer",
      courseId: "course",
      termLabel: "2026",
      authorName: "Anonymous",
      clarity: 3,
      support: 3,
      organization: 3,
      body: "Feedback",
    });
    const admin = { id: "admin", role: "admin" };
    const maintainer = { id: "maintainer", role: "maintainer" };

    for (const role of [undefined, null, "user", "moderator", "admin,user"]) {
      const actor = { id: "user", role };
      expect(await inspectReviews(db, actor)).toEqual({
        data: null,
        error: MODERATION_ERRORS.FORBIDDEN,
      });
      expect(
        await moderateLecturerReview(db, actor, { reviewId: "review", action: "hide" }),
      ).toEqual({ data: null, error: MODERATION_ERRORS.FORBIDDEN });
    }

    const initialReviews = resultData(await inspectReviews(db, admin));
    expect(initialReviews.rows).toHaveLength(1);
    expect(initialReviews.counts).toEqual({ all: 1, published: 1, hidden: 0, deleted: 0 });
    expect(resultData(await inspectReviews(db, maintainer)).rows).toHaveLength(1);
    expect(resultData(await inspectReviews(db, admin, 0, "hidden")).rows).toEqual([]);
    expect(resultData(await inspectReviews(db, admin, 1, "published")).rows).toEqual([]);

    expect(
      await moderateLecturerReview(db, maintainer, { reviewId: "review", action: "hide" }),
    ).toEqual({ data: { reviewId: "review", action: "hide" }, error: null });
    expect(resultData(await inspectReviews(db, admin, 0, "published")).rows).toEqual([]);
    expect(resultData(await inspectReviews(db, admin, 0, "hidden")).rows).toHaveLength(1);
    expect(resultData(await inspectReviews(db, admin)).counts).toEqual({
      all: 1,
      published: 0,
      hidden: 1,
      deleted: 0,
    });

    expect(
      await moderateLecturerReview(db, admin, { reviewId: "review", action: "delete" }),
    ).toEqual({ data: { reviewId: "review", action: "delete" }, error: null });
    expect(resultData(await inspectReviews(db, admin, 0, "hidden")).rows).toEqual([]);
    expect(resultData(await inspectReviews(db, admin, 0, "deleted")).rows).toHaveLength(1);
    expect(resultData(await inspectReviews(db, admin)).counts).toEqual({
      all: 1,
      published: 0,
      hidden: 0,
      deleted: 1,
    });

    expect(
      await moderateLecturerReview(db, admin, { reviewId: "review", action: "restore" }),
    ).toEqual({ data: null, error: MODERATION_ERRORS.REVIEW_ACTION_UNAVAILABLE });
    expect(
      await moderateLecturerReview(db, admin, { reviewId: "missing-review", action: "hide" }),
    ).toEqual({ data: null, error: MODERATION_ERRORS.REVIEW_ACTION_UNAVAILABLE });
    expect(await inspectReviews(db, { id: "user", role: "unknown" })).toEqual({
      data: null,
      error: MODERATION_ERRORS.FORBIDDEN,
    });
  } finally {
    await platform.dispose();
  }
}, 30_000);
