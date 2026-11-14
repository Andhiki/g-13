import { expect, it } from "bun:test";
import { composeLecturerDirectory } from "./read.service";

it("composes per-course summaries from per-metric averages with equal metric weight", () => {
  const directoryData = {
    courses: [
      { id: "c1", code: "CS101", nameId: "Dasar", nameEn: "Basics" },
      { id: "c2", code: "CS102", nameId: "Data", nameEn: "Data" },
    ],
    lecturers: [
      {
        id: "l1",
        name: "Lecturer",
        reviewCount: 3,
        clarityAverage: 4,
        supportAverage: 3,
        organizationAverage: 1,
      },
      {
        id: "l2",
        name: "No Reviews",
        reviewCount: 0,
        clarityAverage: null,
        supportAverage: null,
        organizationAverage: null,
      },
    ],
    courseAggregates: [
      {
        lecturerId: "l1",
        courseId: "c1",
        code: "CS101",
        nameId: "Dasar",
        nameEn: "Basics",
        clarityAverage: 5,
        supportAverage: 3,
        organizationAverage: 1,
      },
      {
        lecturerId: "l1",
        courseId: "c2",
        code: "CS102",
        nameId: "Data",
        nameEn: "Data",
        clarityAverage: 2,
        supportAverage: 3,
        organizationAverage: 1,
      },
    ],
  } satisfies Parameters<typeof composeLecturerDirectory>[0];

  const result = composeLecturerDirectory(directoryData);
  expect(result.lecturers[0]).toMatchObject({
    id: "l1",
    reviewCount: 3,
    overallAverage: 8 / 3,
    courses: [
      { courseId: "c1", overallAverage: 3 },
      { courseId: "c2", overallAverage: 2 },
    ],
  });
  expect(result.lecturers[1]).toMatchObject({
    id: "l2",
    reviewCount: 0,
    overallAverage: null,
    courses: [],
  });
});
