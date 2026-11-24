import { expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { courses } from "@g13/db/schema/courses";
import { reviews } from "@g13/db/schema/lecturer-reviews";
import { lecturers } from "@g13/db/schema/lecturers";
import { createTestPlatformProxy } from "@/test/database";
import { REVIEW_ERRORS } from "../-shared/errors";
import { submissionInputSchema } from "../-shared/submission-schema";
import { setReviewLike } from "./likes.service";
import { getLecturerDetail, getLecturerDirectory } from "./read.service";
import { getBrowserReviewLikes, getCoursePickerPage } from "./repository";
import type { CoursePickerCursor } from "../-shared/schemas";
import { submitReview } from "./submission.service";

const rawInput = {
  lecturerId: "p",
  courseId: "c",
  termLabel: "2026/2027 Ganjil",
  anonymous: false,
  authorName: " Student ",
  clarity: 5,
  support: 4,
  organization: 3,
  body: " Helpful examples ",
};

it("publishes reviews, excludes hidden/deleted entries from public metrics, and atomically limits IPs", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const deletedAt = new Date("2026-11-01T00:00:00Z");
    await db.insert(lecturers).values([
      { id: "p", name: "Lecturer" },
      { id: "empty", name: "No Reviews" },
      { id: "deleted-lecturer", name: "Deleted Lecturer", deletedAt },
    ]);
    await db.insert(courses).values([
      { id: "c", code: "CS101", nameId: "Dasar Komputer", nameEn: "Computer Basics" },
      { id: "deleted-course", code: "CS102", nameId: "Dihapus", nameEn: "Deleted", deletedAt },
    ]);

    const input = submissionInputSchema.parse(rawInput);
    const context = { ip: "192.0.2.1", secret: "test-secret-".repeat(4), now: 3_600_000 };

    expect(await submitReview(db, input, { ...context, ip: null })).toEqual({
      data: null,
      error: REVIEW_ERRORS.UNAVAILABLE,
    });
    for (const invalid of [
      { courseId: "missing" },
      { courseId: "deleted-course" },
      { lecturerId: "missing" },
      { lecturerId: "deleted-lecturer" },
    ]) {
      expect(await submitReview(db, { ...input, ...invalid }, context)).toEqual({
        data: null,
        error: REVIEW_ERRORS.INVALID,
      });
    }

    expect(await submitReview(db, input, context)).toMatchObject({
      data: { reviewId: expect.any(String), status: "published" },
      error: null,
    });
    expect(
      await submitReview(
        db,
        submissionInputSchema.parse({ ...rawInput, anonymous: true }),
        context,
      ),
    ).toMatchObject({ data: { reviewId: expect.any(String), status: "published" }, error: null });

    // Any rating of 2 or lower waits for moderation and never reaches public reads.
    const pendingInput = submissionInputSchema.parse({
      ...rawInput,
      organization: 2,
      body: "Pending feedback",
    });
    const pendingSubmission = await submitReview(db, pendingInput, {
      ...context,
      ip: "192.0.2.9",
    });
    const pendingReviewId = pendingSubmission.data?.reviewId ?? "";
    expect(pendingSubmission).toMatchObject({
      data: { reviewId: expect.any(String), status: "pending" },
      error: null,
    });
    const storedPending = (await db.select().from(reviews)).find(
      (row) => row.id === pendingReviewId,
    );
    expect(storedPending?.status).toBe("pending");
    expect(
      (await getLecturerDetail(db, "p"))?.reviews.some((row) => row.body === "Pending feedback"),
    ).toBe(false);

    // Hidden/deleted reviews and soft-deleted lecturers must not affect public reads or aggregates,
    // while existing published reviews for soft-deleted courses remain visible on active lecturers.
    await db.insert(reviews).values([
      {
        id: "hidden-review",
        lecturerId: "p",
        courseId: "c",
        termLabel: "2026/2027 Ganjil",
        authorName: "Student",
        clarity: 1,
        support: 1,
        organization: 1,
        body: "Hidden feedback",
        status: "hidden",
      },
      {
        id: "deleted-review",
        lecturerId: "p",
        courseId: "c",
        termLabel: "2026/2027 Ganjil",
        authorName: "Student",
        clarity: 1,
        support: 1,
        organization: 1,
        body: "Deleted feedback",
        deletedAt,
      },
      {
        id: "deleted-lecturer-review",
        lecturerId: "deleted-lecturer",
        courseId: "c",
        termLabel: "2026/2027 Ganjil",
        authorName: "Student",
        clarity: 5,
        support: 5,
        organization: 5,
        body: "Hidden with lecturer",
      },
      {
        id: "deleted-course-review",
        lecturerId: "p",
        courseId: "deleted-course",
        termLabel: "2026/2027 Ganjil",
        authorName: "Student",
        clarity: 3,
        support: 3,
        organization: 3,
        body: "Historical feedback",
      },
    ]);

    const directory = await getLecturerDirectory(db);
    expect(directory.lecturers.map((row) => row.id)).toEqual(["p", "empty"]);
    expect(directory.courses.map((row) => row.id)).toEqual(["c"]);
    const visibleLecturer = directory.lecturers.find((row) => row.id === "p");
    expect(visibleLecturer).toMatchObject({
      reviewCount: 3,
      overallAverage: (4 + 4 + 3) / 3,
      courses: [
        { courseId: "c", code: "CS101", overallAverage: 4 },
        { courseId: "deleted-course", code: "CS102", overallAverage: 3 },
      ],
    });
    expect(JSON.stringify(visibleLecturer)).not.toContain("Helpful examples");
    expect(directory.lecturers.find((row) => row.id === "empty")).toMatchObject({
      reviewCount: 0,
      overallAverage: null,
      courses: [],
    });

    const detail = await getLecturerDetail(db, "p");
    expect(detail?.courses.map((row) => row.id)).toEqual(["c"]);
    expect(detail?.reviews.map((row) => row.authorName).sort()).toEqual([
      "Anonymous",
      "Student",
      "Student",
    ]);
    expect(detail?.reviews.some((row) => row.courseId === "deleted-course")).toBe(true);
    expect(await getLecturerDetail(db, "deleted-lecturer")).toBeNull();
    expect(await getLecturerDetail(db, "missing")).toBeNull();

    // Concurrent requests share the hourly IP limit (3 total: 2 above + 1 here).
    const attempts = await Promise.all(
      Array.from({ length: 5 }, () => submitReview(db, input, context)),
    );
    expect(attempts.filter((result) => result.error === null)).toHaveLength(1);
    expect(attempts.filter((result) => result.error === REVIEW_ERRORS.RATE_LIMIT)).toHaveLength(4);
    expect(await submitReview(db, input, { ...context, ip: "192.0.2.2" })).toMatchObject({
      error: null,
    });
    expect(await submitReview(db, input, { ...context, now: 7_200_000 })).toMatchObject({
      error: null,
    });
    const limits = await db.$client.prepare("SELECT * FROM review_submission_limits").all();
    expect(JSON.stringify(limits)).not.toContain("192.0.2");
  } finally {
    await platform.dispose();
  }
}, 30_000);

it("pages the review course picker by keyset, orders by the active language, and searches code and names", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const deletedAt = new Date("2026-11-01T00:00:00Z");
    await db.insert(courses).values([
      ...Array.from({ length: 21 }, (_, index) => {
        const n = String(index + 1).padStart(2, "0");
        return {
          id: `c${n}`,
          code: `PAC${n}`,
          nameId: `Kuliah ${n}`,
          nameEn: `Course ${String(22 - index - 1).padStart(2, "0")}`,
        };
      }),
      { id: "pacs", code: "PACS262", nameId: "Basis Data", nameEn: "Databases" },
      { id: "lanjut", code: "PACS270", nameId: "Basis Data Lanjut", nameEn: "Advanced Databases" },
      { id: "deleted", code: "PACS999", nameId: "Dihapus", nameEn: "Deleted", deletedAt },
    ]);

    // Sorted by the active language's display name then id; only active courses page through.
    const inIndonesian = await getCoursePickerPage(db, { cursor: null, query: "", language: "id" });
    expect(inIndonesian.rows.map((row) => row.id)).toEqual([
      "pacs",
      "lanjut",
      ...Array.from({ length: 18 }, (_, index) => `c${String(index + 1).padStart(2, "0")}`),
    ]);
    expect(inIndonesian.nextCursor).toEqual({ name: "Kuliah 18", id: "c18" });

    const walkedIndonesian: string[] = [];
    let cursor: CoursePickerCursor | null = null;
    do {
      const page = await getCoursePickerPage(db, { cursor, query: "", language: "id" });
      walkedIndonesian.push(...page.rows.map((row) => row.id));
      cursor = page.nextCursor;
    } while (cursor);
    expect(walkedIndonesian).toEqual([
      "pacs",
      "lanjut",
      ...Array.from({ length: 21 }, (_, index) => `c${String(index + 1).padStart(2, "0")}`),
    ]);
    expect(walkedIndonesian).toHaveLength(23);
    expect(new Set(walkedIndonesian).size).toBe(walkedIndonesian.length);

    const walkedEnglish: string[] = [];
    cursor = null;
    do {
      const page = await getCoursePickerPage(db, { cursor, query: "", language: "en" });
      walkedEnglish.push(...page.rows.map((row) => row.id));
      cursor = page.nextCursor;
    } while (cursor);
    expect(walkedEnglish).toEqual([
      "lanjut",
      ...Array.from({ length: 21 }, (_, index) => `c${String(21 - index).padStart(2, "0")}`),
      "pacs",
    ]);

    // Search matches code, nameId, and nameEn case-insensitively; LIKE wildcards stay literal.
    expect(
      await getCoursePickerPage(db, { cursor: null, query: "pacs262", language: "id" }),
    ).toEqual({
      rows: [{ id: "pacs", code: "PACS262", nameId: "Basis Data", nameEn: "Databases" }],
      nextCursor: null,
    });
    expect(
      (
        await getCoursePickerPage(db, { cursor: null, query: "BASIS DATA", language: "id" })
      ).rows.map((row) => row.id),
    ).toEqual(["pacs", "lanjut"]);
    expect(await getCoursePickerPage(db, { cursor: null, query: "%", language: "en" })).toEqual({
      rows: [],
      nextCursor: null,
    });
  } finally {
    await platform.dispose();
  }
}, 30_000);

it("likes and unlikes visible reviews idempotently and enforces rate limits", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await db.insert(lecturers).values([
      { id: "p", name: "Lecturer" },
      { id: "deleted-lecturer", name: "Deleted", deletedAt: new Date("2026-11-01T00:00:00Z") },
    ]);
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
      {
        id: "deleted-lecturer-review",
        lecturerId: "deleted-lecturer",
        courseId: "c",
        termLabel: "2026",
        authorName: "Anonymous",
        clarity: 5,
        support: 5,
        organization: 5,
        body: "Deleted lecturer",
      },
    ]);

    const browserId = crypto.randomUUID();
    const input = { reviewId: "r", browserId, liked: true };
    const context = { ip: "192.0.2.1", secret: "test-secret-".repeat(4), now: 3_600_000 };

    for (const reviewId of ["hidden", "deleted-lecturer-review"]) {
      expect(await setReviewLike(db, { ...input, reviewId }, context)).toEqual({
        data: null,
        error: REVIEW_ERRORS.INVALID,
      });
    }
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
    expect((await getLecturerDetail(db, "p"))?.reviews[0]?.likeCount).toBe(1);

    await db.$client.prepare("UPDATE reviews SET status = 'hidden' WHERE id = 'r'").run();
    expect(await getBrowserReviewLikes(db, browserId)).toEqual([]);
    await db.$client.prepare("UPDATE reviews SET status = 'published' WHERE id = 'r'").run();

    await db.$client
      .prepare("UPDATE lecturers SET deleted_at = 1793491200000 WHERE id = 'p'")
      .run();
    expect(await getBrowserReviewLikes(db, browserId)).toEqual([]);
    await db.$client.prepare("UPDATE lecturers SET deleted_at = NULL WHERE id = 'p'").run();

    expect(await setReviewLike(db, { ...input, liked: false }, context)).toEqual({
      data: { reviewId: "r", liked: false },
      error: null,
    });
    expect(await getBrowserReviewLikes(db, browserId)).toEqual([]);
    expect((await getLecturerDetail(db, "p"))?.reviews[0]?.likeCount).toBe(0);

    for (let i = 0; i < 57; i++) {
      expect((await setReviewLike(db, input, context)).error).toBeNull();
    }
    expect(await setReviewLike(db, input, context)).toEqual({
      data: null,
      error: REVIEW_ERRORS.RATE_LIMIT,
    });
  } finally {
    await platform.dispose();
  }
}, 30_000);
