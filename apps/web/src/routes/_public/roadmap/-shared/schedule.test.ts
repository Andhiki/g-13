import { expect, test } from "bun:test";
import { getCurriculum, type Relation } from "@g13/curriculum";
import { creditsFor } from "@/courses/course-utils";
import { scheduleCourses, semesterCredits, totalRoadmapCredits } from "./schedule";
import { findConflicts } from "./conflicts";
import { planningInput } from "./planning-input";
import { validateRoadmapSearch } from "./search";
import type { Activity, PlannedCourse, Roadmap } from "./planner";

const input = planningInput(
  validateRoadmapSearch({
    kurikulum: "2021",
    minat: "Lab Sistem Cerdas",
    iup: "tidak",
    magang: "tidak",
  }),
)!;
const template = getCurriculum("2021").core[0];

for (const timing of ["before", "concurrent"] as const) {
  test(`scheduling and conflicts agree on ${timing} prerequisite timing without mutating input`, () => {
    const courses: PlannedCourse[] = [
      {
        course: { ...template, id: "source" },
        originalId: "source",
        semester: 2,
        kind: "required",
      },
      {
        course: { ...template, id: "target" },
        originalId: "target",
        semester: 2,
        kind: "elective",
      },
    ];
    const relations: Relation[] = [{ source: "source", target: "target", timing }];
    const scheduled = scheduleCourses(courses, relations, input, new Set());
    expect(courses[1].semester).toBe(2);
    expect(scheduled[1].semester).toBe(timing === "concurrent" ? 2 : 4);
    const plan: Roadmap = {
      courses: scheduled,
      relations,
      activities: [],
      totalCredits: 144,
      requiredCredits: 2,
      conflicts: [],
      notes: [],
    };
    expect(
      findConflicts(plan, input, new Set()).some((conflict) =>
        conflict.key.includes("urutan prasyarat"),
      ),
    ).toBe(false);
    const overlappingPlan: Roadmap = {
      ...plan,
      courses: scheduled.map((item) =>
        item.course.id === "target" ? { ...item, semester: 2 } : item,
      ),
    };
    expect(
      findConflicts(overlappingPlan, input, new Set()).some((conflict) =>
        conflict.key.includes("urutan prasyarat"),
      ),
    ).toBe(timing === "before");
  });
}

test("semesterCredits and totalRoadmapCredits combine courses and activities", () => {
  const [first, second] = getCurriculum("2021").core;
  const firstCredits = creditsFor(first) ?? 0;
  const secondCredits = creditsFor(second) ?? 0;
  const courses: PlannedCourse[] = [
    {
      course: first,
      originalId: first.id,
      semester: 1,
      kind: "required",
    },
    {
      course: second,
      originalId: second.id,
      semester: 6,
      kind: "elective",
    },
  ];
  const activities: Activity[] = [
    {
      id: "exchange",
      title: "Exchange",
      semester: 6,
      endSemester: 6,
      detail: "",
      fullSemester: true,
      recommendedCredits: 20,
    },
  ];

  expect(semesterCredits(1, courses, activities)).toBe(firstCredits);
  expect(semesterCredits(6, courses, activities)).toBe(secondCredits + 20);
  expect(totalRoadmapCredits(courses, activities)).toBe(firstCredits + secondCredits + 20);
});
