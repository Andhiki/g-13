import { fileURLToPath } from "node:url";
import { expect, it } from "bun:test";
import { getPlatformProxy } from "wrangler";
import { createDatabase, courses, professors } from "@g13/db";
import { getPublicProfessorReviews } from "./repository";
import { submitReview, validateSubmission } from "./submission";

const input = {
  professorId: "p",
  courseId: "c",
  termLabel: "2026/2027 Ganjil",
  anonymous: false,
  authorName: " Student ",
  clarity: 5,
  support: 3,
  organization: 1,
  body: " Helpful examples ",
};
it("validates required fields, integer ratings, limits and anonymous names", () => {
  expect(validateSubmission(input).authorName).toBe("Student");
  expect(validateSubmission({ ...input, anonymous: true, authorName: null }).authorName).toBe(
    "Anonymous",
  );
  for (const patch of [
    { clarity: 0 },
    { support: 6 },
    { organization: 1.5 },
    { clarity: "5" },
    { body: " " },
    { body: "x".repeat(1001) },
    { termLabel: "" },
    { authorName: "" },
    { anonymous: "true" },
  ]) {
    expect(() => validateSubmission({ ...input, ...patch })).toThrow();
  }
});
it("publishes named and anonymous submissions, rejects references, and atomically limits IPs", async () => {
  const platform = await getPlatformProxy<{ DB: D1Database }>({
    configPath: fileURLToPath(new URL("../../../wrangler.jsonc", import.meta.url)),
    persist: false,
  });
  try {
    const schema = await Bun.file(
      new URL("../../../../../packages/db/schema.sql", import.meta.url),
    ).text();
    for (const sql of schema
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean))
      await platform.env.DB.prepare(sql).run();
    const db = createDatabase(platform.env.DB);
    await db.insert(professors).values({ id: "p", name: "Professor" });
    await db.insert(courses).values({ id: "c", code: "CS1", nameId: "Data", nameEn: "Data" });
    const context = {
      enabled: true,
      ip: "192.0.2.1",
      secret: "test-secret-".repeat(4),
      now: 3_600_000,
    };
    expect(await submitReview(db, input, { ...context, enabled: false })).toEqual({
      ok: false,
      error: "unavailable",
    });
    expect(await submitReview(db, input, { ...context, ip: null })).toEqual({
      ok: false,
      error: "unavailable",
    });
    expect(await submitReview(db, { ...input, courseId: "missing" }, context)).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(await submitReview(db, { ...input, professorId: "missing" }, context)).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(await submitReview(db, input, context)).toEqual({ ok: true });
    expect(await submitReview(db, { ...input, anonymous: true }, context)).toEqual({ ok: true });
    let data = await getPublicProfessorReviews(db);
    expect(data.professors[0]).toMatchObject({ reviewCount: 2, overallAverage: 3 });
    expect(data.professors[0].reviews.map((r) => r.authorName).sort()).toEqual([
      "Anonymous",
      "Student",
    ]);
    const attempts = await Promise.all(
      Array.from({ length: 5 }, () => submitReview(db, input, context)),
    );
    expect(attempts.filter((r) => r.ok)).toHaveLength(1);
    expect(attempts.filter((r) => !r.ok && r.error === "rate-limit")).toHaveLength(4);
    expect(await submitReview(db, input, { ...context, ip: "192.0.2.2" })).toEqual({ ok: true });
    expect(await submitReview(db, input, { ...context, now: 7_200_000 })).toEqual({ ok: true });
    const limits = await db.$client.prepare("SELECT * FROM review_submission_limits").all();
    expect(JSON.stringify(limits)).not.toContain("192.0.2");
    expect(limits.results).toHaveLength(1);
    data = await getPublicProfessorReviews(db);
    expect(data.professors[0].reviewCount).toBe(5);
  } finally {
    await platform.dispose();
  }
}, 30_000);
