import { expect, it } from "bun:test";
import { createDatabase, courses, lecturers, reviews } from "@g13/db";
import { createTestPlatformProxy } from "@/test/database";
import { getLecturerDetail, getLecturerDirectory } from "@/routes/lecturers/-server/read.service";
import { moderateReview } from "./repository";

it("hides, restores, and soft-deletes reviews without restoring deleted data", async () => {
  const platform = await createTestPlatformProxy();

  try {
    const database = createDatabase(platform.env.DB);
    await database.insert(lecturers).values({ id: "lecturer", name: "Lecturer" });
    await database
      .insert(courses)
      .values({ id: "course", code: "CS", nameId: "Data", nameEn: "Data" });
    await database.insert(reviews).values({
      id: "review",
      lecturerId: "lecturer",
      courseId: "course",
      termLabel: "2026/2027 Ganjil",
      authorName: "Student",
      clarity: 5,
      support: 3,
      organization: 1,
      body: "Feedback",
    });

    expect((await getLecturerDetail(database, "lecturer"))?.reviews).toHaveLength(1);
    expect(await moderateReview(database, { reviewId: "review", action: "hide" })).toBe(true);
    expect((await getLecturerDetail(database, "lecturer"))?.reviews).toEqual([]);
    expect((await getLecturerDetail(database, "lecturer"))?.lecturer.overallAverage).toBeNull();
    expect(
      (await getLecturerDirectory(database)).lecturers.find((row) => row.id === "lecturer"),
    ).toMatchObject({ reviewCount: 0, overallAverage: null, courses: [] });

    expect(await moderateReview(database, { reviewId: "review", action: "restore" })).toBe(true);
    expect((await getLecturerDetail(database, "lecturer"))?.lecturer).toMatchObject({
      reviewCount: 1,
      overallAverage: 3,
    });
    expect(await moderateReview(database, { reviewId: "review", action: "delete" })).toBe(true);
    expect(await moderateReview(database, { reviewId: "review", action: "restore" })).toBe(false);
    expect(await moderateReview(database, { reviewId: "review", action: "hide" })).toBe(false);
    expect(await moderateReview(database, { reviewId: "review", action: "delete" })).toBe(false);
    expect(await moderateReview(database, { reviewId: "missing-review", action: "restore" })).toBe(
      false,
    );
    expect((await getLecturerDetail(database, "lecturer"))?.reviews).toEqual([]);
    expect(
      (await getLecturerDirectory(database)).lecturers.find((row) => row.id === "lecturer"),
    ).toMatchObject({ reviewCount: 0, overallAverage: null, courses: [] });
  } finally {
    await platform.dispose();
  }
}, 30_000);
