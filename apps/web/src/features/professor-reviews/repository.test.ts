import { expect, it } from "bun:test";
import { getPlatformProxy } from "wrangler";
import { createDatabase, courses, professors, reviews } from "@g13/db";
import { getPublicProfessorReviews } from "./repository";

it("returns only published, non-deleted reviews in public professor metrics", async () => {
  const platform = await getPlatformProxy<{ DB: D1Database }>({
    configPath: new URL("../../../wrangler.jsonc", import.meta.url).pathname,
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
    await database.insert(professors).values([
      { id: "prof-visible", name: "Visible Professor" },
      { id: "prof-empty", name: "Professor Without Reviews" },
    ]);
    await database.insert(courses).values([
      { id: "course-one", code: "CS101", nameId: "Dasar Komputer", nameEn: "Computer Basics" },
      { id: "course-two", code: "CS102", nameId: "Data", nameEn: "Data" },
    ]);
    await expect(
      Promise.resolve(
        database.insert(reviews).values({
          id: "invalid-rating",
          professorId: "prof-visible",
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
          professorId: "missing-professor",
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
        professorId: "prof-visible",
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
        professorId: "prof-visible",
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
        professorId: "prof-visible",
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

    const result = await getPublicProfessorReviews(database);
    const visibleProfessor = result.professors.find((professor) => professor.id === "prof-visible");
    const emptyProfessor = result.professors.find((professor) => professor.id === "prof-empty");

    expect(visibleProfessor).toMatchObject({
      reviewCount: 1,
      overallAverage: 3,
      clarityAverage: 5,
      supportAverage: 3,
      organizationAverage: 1,
    });
    expect(visibleProfessor?.reviews.map((review) => review.id)).toEqual(["visible-review"]);
    expect(emptyProfessor).toMatchObject({
      reviewCount: 0,
      overallAverage: null,
      clarityAverage: null,
      supportAverage: null,
      organizationAverage: null,
      reviews: [],
    });
    expect(result.courses).toContainEqual({
      id: "course-one",
      code: "CS101",
      nameId: "Dasar Komputer",
      nameEn: "Computer Basics",
    });
  } finally {
    await platform.dispose();
  }
}, 30_000);
