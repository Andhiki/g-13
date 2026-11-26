import { eq } from "drizzle-orm";
import { expect, it } from "bun:test";
import { createDatabase } from "@g13/db/client";
import { authUser } from "@g13/db/schema/auth";
import { courses } from "@g13/db/schema/courses";
import { reviews } from "@g13/db/schema/lecturer-reviews";
import { lecturers } from "@g13/db/schema/lecturers";
import { notificationEvents } from "@g13/db/schema/notifications";
import { createTestPlatformProxy } from "@/test/database";
import { REVIEW_ERRORS } from "../-shared/errors";
import { REVIEW_BODY_MIN_LENGTH, submissionInputSchema } from "../-shared/submission-schema";
import { setReviewLike } from "./likes.service";
import { getLecturerDetail, getLecturerDirectory } from "./read.service";
import { getBrowserReviewLikes, getCoursePickerPage, getOwnPendingReviews } from "./repository";
import type { CoursePickerCursor } from "../-shared/schemas";
import { classifyReviewText } from "./review-moderation";
import { submitReview, submitReviewAfterCaptcha } from "./submission.service";

const clearScreening = {
  openAiApiKey: "test-key",
  classify: async () => "clear" as const,
};

const rawInput = {
  lecturerId: "p",
  courseId: "c",
  termLabel: "2026/2027 Ganjil",
  anonymous: false,
  authorName: " Student ",
  clarity: 5,
  support: 4,
  organization: 3,
  body: " Helpful examples and clear slides ",
};

it("rejects review bodies shorter than the minimum after trimming", () => {
  const minimum = "A".repeat(REVIEW_BODY_MIN_LENGTH);
  expect(submissionInputSchema.safeParse({ ...rawInput, body: minimum }).success).toBe(true);
  expect(
    submissionInputSchema.safeParse({ ...rawInput, body: "A".repeat(REVIEW_BODY_MIN_LENGTH - 1) })
      .success,
  ).toBe(false);
  expect(
    submissionInputSchema.safeParse({ ...rawInput, body: ` ${minimum.slice(1)} ` }).success,
  ).toBe(false);
});

it("returns only requested, live pending reviews for the matching lecturer", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await db.insert(lecturers).values([
      { id: "p", name: "Lecturer" },
      { id: "other", name: "Other Lecturer" },
    ]);
    await db.insert(courses).values({
      id: "c",
      code: "CS101",
      nameId: "Dasar Komputer",
      nameEn: "Computer Basics",
    });
    const input = submissionInputSchema.parse({ ...rawInput, organization: 2 });
    const result = await submitReview(db, input, {
      ip: "192.0.2.1",
      secret: "test-secret-".repeat(4),
      ...clearScreening,
    });
    if (!result.data) throw new Error("Expected a pending review");
    const { reviewId } = result.data;
    const unknownId = crypto.randomUUID();
    expect(await getOwnPendingReviews(db, "p", [])).toEqual([]);
    expect(await getOwnPendingReviews(db, "p", [unknownId])).toEqual([]);
    expect(await getOwnPendingReviews(db, "other", [reviewId])).toEqual([]);
    expect(await getOwnPendingReviews(db, "p", [reviewId, unknownId])).toEqual([
      expect.objectContaining({ id: reviewId, body: input.body, code: "CS101" }),
    ]);
    expect((await getLecturerDetail(db, "p"))?.reviews).toEqual([]);

    for (const status of ["published", "hidden"] as const) {
      await db.update(reviews).set({ status }).where(eq(reviews.id, reviewId));
      expect(await getOwnPendingReviews(db, "p", [reviewId])).toEqual([]);
      expect((await getLecturerDetail(db, "p"))?.reviews.map(({ id }) => id)).toEqual(
        status === "published" ? [reviewId] : [],
      );
    }
    await db
      .update(reviews)
      .set({ status: "pending", deletedAt: new Date() })
      .where(eq(reviews.id, reviewId));
    expect(await getOwnPendingReviews(db, "p", [reviewId])).toEqual([]);
  } finally {
    await platform.dispose();
  }
});

it("publishes reviews, excludes hidden/deleted entries from public metrics, and atomically limits submissions without a browser per IP", async () => {
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
    await db.insert(authUser).values({
      id: "admin",
      name: "Admin",
      email: "admin@example.com",
      role: "admin",
      createdAt: deletedAt,
      updatedAt: deletedAt,
    });

    const input = submissionInputSchema.parse(rawInput);
    let classifierCalls = 0;
    const context = {
      ip: "192.0.2.1",
      secret: "test-secret-".repeat(4),
      now: 3_600_000,
      openAiApiKey: "test-key",
      classify: async () => {
        classifierCalls += 1;
        return "clear" as const;
      },
    };

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
    expect(classifierCalls).toBe(0);

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
    expect(classifierCalls).toBe(2);
    expect(await db.select().from(notificationEvents)).toEqual([]);

    // Any rating of 2 or lower waits for moderation and never reaches public reads.
    const pendingInput = submissionInputSchema.parse({
      ...rawInput,
      organization: 2,
      body: "Pending feedback needs a closer look",
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
    expect((await db.select().from(notificationEvents)).map((event) => event.resourceId)).toEqual([
      pendingReviewId,
    ]);
    expect(classifierCalls).toBe(3);

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
    expect(classifierCalls).toBe(4);
    expect(await submitReview(db, input, { ...context, ip: "192.0.2.2" })).toMatchObject({
      error: null,
    });
    expect(classifierCalls).toBe(5);
    expect(await submitReview(db, input, { ...context, now: 7_200_000 })).toMatchObject({
      error: null,
    });
    expect(classifierCalls).toBe(6);
    const limits = await db.$client.prepare("SELECT * FROM review_submission_limits").all();
    expect(JSON.stringify(limits)).not.toContain("192.0.2");
  } finally {
    await platform.dispose();
  }
}, 30_000);

it("screens valid review text and sends flagged or unscorable reviews to Pending", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await db.insert(lecturers).values({ id: "p", name: "Lecturer" });
    await db
      .insert(courses)
      .values({ id: "c", code: "CS101", nameId: "Dasar Komputer", nameEn: "Computer Basics" });

    const screened: { body: string; displayName?: string }[] = [];
    const outcomes = ["clear", "flagged", "unscorable", "clear", "clear"] as const;
    let outcomeIndex = 0;
    const context = (ip: string) => ({
      ip,
      secret: "test-secret-".repeat(4),
      openAiApiKey: "test-key",
      classify: async (value: { body: string; displayName?: string }) => {
        screened.push(value);
        return outcomes[outcomeIndex++] ?? "clear";
      },
    });
    const input = submissionInputSchema.parse(rawInput);

    const published = await submitReview(db, input, context("192.0.2.31"));
    expect(published.data?.status).toBe("published");
    expect(screened[0]).toEqual({ body: input.body, displayName: "Student" });

    const flagged = await submitReview(db, input, context("192.0.2.32"));
    expect(flagged.data?.status).toBe("pending");
    expect(
      (await getLecturerDetail(db, "p"))?.reviews.some(
        (review) => review.id === flagged.data?.reviewId,
      ),
    ).toBe(false);

    const unscorable = await submitReview(db, input, context("192.0.2.33"));
    expect(unscorable.data?.status).toBe("pending");

    const lowRated = await submitReview(
      db,
      submissionInputSchema.parse({ ...rawInput, organization: 2 }),
      context("192.0.2.34"),
    );
    expect(lowRated.data?.status).toBe("pending");

    const anonymous = await submitReview(
      db,
      submissionInputSchema.parse({ ...rawInput, anonymous: true, authorName: "" }),
      context("192.0.2.35"),
    );
    expect(anonymous.data?.status).toBe("published");
    expect(screened.at(-1)).toEqual({ body: input.body });

    const localSpam = await submitReview(
      db,
      submissionInputSchema.parse({
        ...rawInput,
        body: "Promo kursus online, daftar sekarang dan gunakan kode STUDI di https://example.com",
      }),
      {
        ...context("192.0.2.36"),
        openAiApiKey: "",
        classify: (value) => classifyReviewText(value, ""),
      },
    );
    expect(localSpam.data?.status).toBe("pending");
  } finally {
    await platform.dispose();
  }
}, 30_000);

it("does not invoke review screening when CAPTCHA verification fails", async () => {
  let classifierCalls = 0;
  const result = await submitReviewAfterCaptcha(false, async () => {
    classifierCalls += 1;
    return { data: { reviewId: "unexpected", status: "published" as const }, error: null };
  });
  expect(result).toEqual({ data: null, error: REVIEW_ERRORS.CAPTCHA });
  expect(classifierCalls).toBe(0);
});

it("limits submissions per browser and keeps an IP ceiling", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    await db.insert(lecturers).values({ id: "p", name: "Lecturer" });
    await db.insert(courses).values({
      id: "c",
      code: "CS101",
      nameId: "Dasar Komputer",
      nameEn: "Computer Basics",
    });
    const input = submissionInputSchema.parse(rawInput);
    const secret = "test-secret-".repeat(4);
    const now = 7_200_000;
    const ip = "198.51.100.23";
    let classifierCalls = 0;
    const screening = {
      openAiApiKey: "test-key",
      classify: async () => {
        classifierCalls += 1;
        return "clear" as const;
      },
    };
    const browserA = crypto.randomUUID();
    const browserB = crypto.randomUUID();

    // Two browsers behind the same shared IP each get their own hourly quota.
    for (const browserId of [browserA, browserB]) {
      for (let i = 0; i < 3; i++) {
        expect(
          await submitReview(db, input, { ip, browserId, secret, now, ...screening }),
        ).toMatchObject({
          error: null,
        });
      }
      expect(await submitReview(db, input, { ip, browserId, secret, now, ...screening })).toEqual({
        data: null,
        error: REVIEW_ERRORS.RATE_LIMIT,
        resetAt: 10_800_000,
      });
    }

    // The quota follows the browser, not the network.
    expect(
      await submitReview(db, input, {
        ip: "198.51.100.24",
        browserId: browserA,
        secret,
        now,
        ...screening,
      }),
    ).toEqual({ data: null, error: REVIEW_ERRORS.RATE_LIMIT, resetAt: 10_800_000 });

    // The IP backstop allows 14 more of the 21 rotated-browser attempts (6 used above).
    let allowed = 0;
    let rejected = 0;
    for (let browser = 0; browser < 7; browser++) {
      const browserId = crypto.randomUUID();
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await submitReview(db, input, {
          ip,
          browserId,
          secret,
          now,
          ...screening,
        });
        if (result.error === null) allowed++;
        else if (result.error === REVIEW_ERRORS.RATE_LIMIT) rejected++;
      }
    }
    expect(allowed).toBe(14);
    expect(rejected).toBe(7);
    expect(classifierCalls).toBe(20);
  } finally {
    await platform.dispose();
  }
}, 30_000);

it("uses the rate-limit cleanup and browser like lookup indexes", async () => {
  const platform = await createTestPlatformProxy();
  try {
    const db = createDatabase(platform.env.DB);
    const cleanup = await db.$client
      .prepare("EXPLAIN QUERY PLAN DELETE FROM review_submission_limits WHERE expires_at <= 0")
      .all();
    const browserLikes = await db.$client
      .prepare("EXPLAIN QUERY PLAN SELECT review_id FROM review_likes WHERE browser_id = 'browser'")
      .all();
    expect(JSON.stringify(cleanup)).toContain("review_submission_limits_expires_at_idx");
    expect(JSON.stringify(browserLikes)).toContain("review_likes_browser_id_idx");
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
    const context = {
      ip: "192.0.2.1",
      secret: "test-secret-".repeat(4),
      now: 3_600_000,
      ...clearScreening,
    };

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
      resetAt: 7_200_000,
    });

    // Likes use a separate bucket; exhausting them must not consume submissions.
    expect(await submitReview(db, submissionInputSchema.parse(rawInput), context)).toMatchObject({
      data: { reviewId: expect.any(String) },
      error: null,
    });
  } finally {
    await platform.dispose();
  }
}, 30_000);
