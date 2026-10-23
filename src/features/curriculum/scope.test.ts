import { describe, expect, test } from "bun:test";
import type { Course, Curriculum, Relation } from "../../data";
import { coursesForScope } from "./scope";

function course(
  id: string,
  section: "core" | "interest",
  semester: number | null,
  group = "",
): Course {
  return {
    id,
    code: id,
    title: id,
    englishTitle: "",
    placements: [
      {
        section,
        label: section,
        group,
        semester,
        semesterLabel: semester ? String(semester) : "",
        credits: 3,
        prerequisiteRaw: "",
        printedPage: null,
        pdfPage: null,
      },
    ],
  };
}

function curriculum(all: Course[]): Curriculum {
  return {
    id: "2026",
    edition: "2026",
    all,
    core: all.filter((item) => item.placements[0].section === "core"),
    electives: all.filter((item) => item.placements[0].section !== "core"),
    groups: [],
    requiredCredits: 0,
    totalCredits: 0,
    summary: "",
    sourceTitle: "",
    sourceUrl: null,
    readingNotes: [],
  };
}

describe("curriculum scope filtering", () => {
  const courses = [
    course("core-1", "core", 1),
    course("core-3", "core", 3),
    course("core-5", "core", 5),
    course("choice-a", "interest", null, "A"),
    course("choice-b", "interest", null, "B"),
  ];
  const data = curriculum(courses);
  const relations: Relation[] = [
    { source: "core-1", target: "core-3" },
    { source: "core-3", target: "core-5" },
    { source: "choice-a", target: "core-1" },
    { source: "choice-b", target: "core-1" },
  ];

  test("keeps the selected semester and its direct visible relation neighbors", () => {
    expect(coursesForScope(data, relations, "__all__", "1").map((item) => item.id)).toEqual([
      "core-1",
      "core-3",
      "choice-a",
      "choice-b",
    ]);
  });

  test("applies choice groups before adding relation neighbors", () => {
    expect(coursesForScope(data, relations, "A", "choices").map((item) => item.id)).toEqual([
      "core-1",
      "choice-a",
    ]);
  });
});
