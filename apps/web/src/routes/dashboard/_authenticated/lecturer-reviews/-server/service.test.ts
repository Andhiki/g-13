import { expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { courses } from "@g13/db/schema/courses";
import { reviews } from "@g13/db/schema/lecturer-reviews";
import { lecturers } from "@g13/db/schema/lecturers";
import {
  getLecturerDetail,
  getLecturerDirectory,
} from "@/routes/_public/lecturers/-server/read.service";
import { createTestPlatformProxy } from "@/test/database";
import { MODERATION_ERRORS, type ModerationOperationResult } from "../-shared/errors";
import { inspectReview, inspectReviews, moderateLecturerReview } from "./service";

function resultData<T>(result: ModerationOperationResult<T>): T {
  if (result.error !== null) throw new Error(result.error);
  return result.data;
}

it("enforces moderation RBAC, status transitions, and public aggregate updates", async () => {
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
      clarity: 5,
      support: 3,
      organization: 1,
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

    expect(resultData(await inspectReview(db, admin, "review"))).toMatchObject({
      id: "review",
      lecturerName: "Lecturer",
      courseCode: "CS",
    });
    expect(resultData(await inspectReviews(db, maintainer)).counts).toEqual({
      all: 1,
      published: 1,
      hidden: 0,
      deleted: 0,
    });

    // Hide removes review from public detail and directory aggregates.
    expect(
      await moderateLecturerReview(db, maintainer, { reviewId: "review", action: "hide" }),
    ).toEqual({ data: { reviewId: "review", action: "hide" }, error: null });
    expect((await getLecturerDetail(db, "lecturer"))?.reviews).toEqual([]);
    expect((await getLecturerDirectory(db)).lecturers[0]).toMatchObject({
      reviewCount: 0,
      overallAverage: null,
      courses: [],
    });
    expect(resultData(await inspectReviews(db, admin)).counts).toEqual({
      all: 1,
      published: 0,
      hidden: 1,
      deleted: 0,
    });

    // Restore brings it back.
    expect(
      await moderateLecturerReview(db, admin, { reviewId: "review", action: "restore" }),
    ).toEqual({ data: { reviewId: "review", action: "restore" }, error: null });
    expect((await getLecturerDetail(db, "lecturer"))?.lecturer).toMatchObject({
      reviewCount: 1,
      overallAverage: 3,
    });

    // Soft-delete is permanent and rejects subsequent actions.
    expect(
      await moderateLecturerReview(db, admin, { reviewId: "review", action: "delete" }),
    ).toEqual({ data: { reviewId: "review", action: "delete" }, error: null });
    expect((await getLecturerDetail(db, "lecturer"))?.reviews).toEqual([]);
    expect(resultData(await inspectReviews(db, admin)).counts).toEqual({
      all: 1,
      published: 0,
      hidden: 0,
      deleted: 1,
    });
    for (const action of ["restore", "hide", "delete"] as const) {
      expect(await moderateLecturerReview(db, admin, { reviewId: "review", action })).toEqual({
        data: null,
        error: MODERATION_ERRORS.REVIEW_ACTION_UNAVAILABLE,
      });
    }
    expect(
      await moderateLecturerReview(db, admin, { reviewId: "missing-review", action: "hide" }),
    ).toEqual({ data: null, error: MODERATION_ERRORS.REVIEW_ACTION_UNAVAILABLE });
  } finally {
    await platform.dispose();
  }
}, 30_000);
