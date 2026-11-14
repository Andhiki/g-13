import { fileURLToPath } from "node:url";
import { expect, it } from "bun:test";
import { getPlatformProxy } from "wrangler";
import { createDatabase, courses, lecturers, reviews } from "@g13/db";
import { getLecturerDetail, getLecturerDirectory } from "./repository";

it("returns only published, non-deleted reviews in public lecturer metrics", async () => {
  const platform = await getPlatformProxy<{ DB: D1Database }>({
    configPath: fileURLToPath(new URL("../../../wrangler.jsonc", import.meta.url)),
    persist: false,
  });

  try {
    const schemaSql = await Bun.file(
      new URL("../../../../../packages/db/schema.sql", import.meta.url),
    ).text();
    for (const statement of schemaSql
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)) {
      await platform.env.DB.prepare(statement).run();
    }

    const database = createDatabase(platform.env.DB);
    await database.insert(lecturers).values([
      { id: "lecturer-visible", name: "Visible Lecturer" },
      { id: "lecturer-empty", name: "Lecturer Without Reviews" },
    ]);
    await database.insert(courses).values([
      { id: "course-one", code: "CS101", nameId: "Dasar Komputer", nameEn: "Computer Basics" },
      { id: "course-two", code: "CS102", nameId: "Data", nameEn: "Data" },
    ]);
    await expect(
      Promise.resolve(
        database.insert(reviews).values({
          id: "invalid-rating",
          lecturerId: "lecturer-visible",
          courseId: "course-one",
          termLabel: "2026/2027 Ganjil",
          authorName: "Student",
          clarity: 6,
          support: 3,
          organization: 1,
          body: "Invalid rating",
        }),
      ),
    ).rejects.toThrow();
    await expect(
      Promise.resolve(
        database.insert(reviews).values({
          id: "invalid-reference",
          lecturerId: "missing-lecturer",
          courseId: "course-one",
          termLabel: "2026/2027 Ganjil",
          authorName: "Student",
          clarity: 3,
          support: 3,
          organization: 3,
          body: "Invalid reference",
        }),
      ),
    ).rejects.toThrow();
    await database.insert(reviews).values([
      {
        id: "visible-review",
        lecturerId: "lecturer-visible",
        courseId: "course-one",
        termLabel: "2026/2027 Ganjil",
        authorName: "Student",
        clarity: 5,
        support: 3,
        organization: 1,
        body: "Published feedback",
      },
      {
        id: "hidden-review",
        lecturerId: "lecturer-visible",
        courseId: "course-one",
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
        lecturerId: "lecturer-visible",
        courseId: "course-one",
        termLabel: "2026/2027 Ganjil",
        authorName: "Student",
        clarity: 1,
        support: 1,
        organization: 1,
        body: "Deleted feedback",
        deletedAt: new Date("2026-11-01T00:00:00Z"),
      },
    ]);

    const result = await getLecturerDirectory(database);
    const visibleLecturer = result.lecturers.find((lecturer) => lecturer.id === "lecturer-visible");
    const emptyLecturer = result.lecturers.find((lecturer) => lecturer.id === "lecturer-empty");

    expect(visibleLecturer).toMatchObject({
      reviewCount: 1,
      overallAverage: 3,
      courses: [
        {
          courseId: "course-one",
          code: "CS101",
          nameId: "Dasar Komputer",
          nameEn: "Computer Basics",
          overallAverage: 3,
        },
      ],
    });
    expect(JSON.stringify(visibleLecturer)).not.toContain("Published feedback");
    expect(emptyLecturer).toMatchObject({
      reviewCount: 0,
      overallAverage: null,
      courses: [],
    });
    expect(result.courses).toContainEqual({
      id: "course-one",
      code: "CS101",
      nameId: "Dasar Komputer",
      nameEn: "Computer Basics",
    });
    const detail = await getLecturerDetail(database, "lecturer-visible");
    expect(detail?.reviews.map((review) => review.id)).toEqual(["visible-review"]);
    expect(detail?.lecturer).toMatchObject({
      id: "lecturer-visible",
      reviewCount: 1,
      overallAverage: 3,
      clarityAverage: 5,
      supportAverage: 3,
      organizationAverage: 1,
    });
    expect((await getLecturerDetail(database, "lecturer-empty"))?.reviews).toEqual([]);
    expect(await getLecturerDetail(database, "missing-lecturer")).toBeNull();
  } finally {
    await platform.dispose();
  }
}, 30_000);
