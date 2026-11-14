import { expect, it } from "bun:test";
import { fileURLToPath } from "node:url";
import { getPlatformProxy } from "wrangler";
import { createDatabase, courses, lecturers, reviews } from "@g13/db";
import { getBrowserLikes, setReviewLike } from "./likes";
import { getLecturerDetail } from "./repository";

it("likes and unlikes visible reviews once per browser and limits abuse", async () => {
  const platform = await getPlatformProxy<{ DB: D1Database }>({
    configPath: fileURLToPath(new URL("../../../wrangler.jsonc", import.meta.url)),
    persist: false,
  });
  try {
    const schema = await Bun.file(
      new URL("../../../../../packages/db/schema.sql", import.meta.url),
    ).text();
    for (const statement of schema
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean))
      await platform.env.DB.prepare(statement).run();
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
    const browserId = crypto.randomUUID();
    const input = { reviewId: "r", browserId, liked: true };
    const context = {
      ip: "192.0.2.1",
      secret: "test-secret-".repeat(4),
      now: 3_600_000,
    };
    expect(await setReviewLike(db, { ...input, reviewId: "hidden" }, context)).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(await setReviewLike(db, { ...input, browserId: "invalid" }, context)).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(await setReviewLike(db, input, { ...context, ip: null })).toEqual({
      ok: false,
      error: "unavailable",
    });
    expect(await setReviewLike(db, input, context)).toEqual({ ok: true });
    expect(await setReviewLike(db, input, context)).toEqual({ ok: true });
    expect(await getBrowserLikes(db, browserId)).toEqual(["r"]);
    expect((await getLecturerDetail(db, "p"))?.reviews[0].likeCount).toBe(1);
    expect(await setReviewLike(db, { ...input, liked: false }, context)).toEqual({ ok: true });
    expect(await getBrowserLikes(db, browserId)).toEqual([]);
    expect((await getLecturerDetail(db, "p"))?.reviews[0].likeCount).toBe(0);
    for (let i = 0; i < 57; i++)
      expect(await setReviewLike(db, input, context)).toEqual({ ok: true });
    expect(await setReviewLike(db, input, context)).toEqual({ ok: false, error: "rate-limit" });
    expect(
      JSON.stringify(await platform.env.DB.prepare("SELECT * FROM review_submission_limits").all()),
    ).not.toContain(context.ip);
  } finally {
    await platform.dispose();
  }
}, 30_000);
