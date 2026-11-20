import { expect, test } from "bun:test";
import { getCurriculum, type Relation } from "@g13/curriculum";
import { scheduleCourses } from "./schedule";
import { findConflicts } from "./conflicts";
import { planningInput } from "./planning-input";
import { validateRoadmapSearch } from "./search";
import type { PlannedCourse, Roadmap } from "./planner";

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
  test(`scheduling and conflicts agree on ${timing} prerequisite timing`, () => {
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
    scheduleCourses(courses, relations, input, new Set());
    expect(courses[1].semester).toBe(timing === "concurrent" ? 2 : 4);
    const plan: Roadmap = {
      courses,
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
    courses[1].semester = 2;
    expect(
      findConflicts(plan, input, new Set()).some((conflict) =>
        conflict.key.includes("urutan prasyarat"),
      ),
    ).toBe(timing === "before");
  });
}
