import { expect, test } from "bun:test";
import {
  defaultCurriculumId,
  getAcademicRules,
  getCourse,
  getCurriculum,
  getRelations,
  getSyllabus,
  isCurriculumId,
  listCurricula,
} from "@g13/curriculum";

test("consumers resolve the built package and unknown curriculum IDs fail validation", () => {
  expect(import.meta.resolve("@g13/curriculum")).toEndWith("/dist/index.mjs");
  expect(isCurriculumId(defaultCurriculumId)).toBe(true);
  for (const value of [undefined, null, {}, 2026, "missing", "__proto__", "constructor"])
    expect(isCurriculumId(value)).toBe(false);
});

for (const curriculum of listCurricula()) {
  test(`${curriculum.id} DAL preserves course identity and missing lookups`, () => {
    expect(getCurriculum(curriculum.id)).toBe(curriculum);
    expect(curriculum.all.length).toBeGreaterThan(0);
    expect(new Set(curriculum.all.map((course) => course.id)).size).toBe(curriculum.all.length);
    for (const course of curriculum.all) {
      expect(getCourse(curriculum.id, course.id)).toBe(course);
      expect(course.placements.length).toBeGreaterThan(0);
    }
    expect(getCourse(curriculum.id, "missing")).toBeUndefined();
    for (const code of ["missing", "__proto__", "constructor"])
      expect(getSyllabus(curriculum.id, code)).toBeUndefined();
    for (const relation of getRelations(curriculum.id)) {
      expect(getCourse(curriculum.id, relation.source)).toBeDefined();
      expect(getCourse(curriculum.id, relation.target)).toBeDefined();
      expect(relation.source).not.toBe(relation.target);
    }
  });

  test(`${curriculum.id} academic rules reference existing courses and internship choices`, () => {
    const rules = getAcademicRules(curriculum.id);
    const scheduling = rules.scheduling;
    const ids = [
      ...rules.excludedCoreIds,
      ...rules.religionChoiceIds,
      ...Object.values(rules.preferredElectives).flat(),
      ...(rules.internship.kind === "credited"
        ? rules.internship.options.map((option) => option.courseId)
        : []),
      ...scheduling.graduationIds,
      scheduling.proposalId,
      ...scheduling.overflowCourseIds,
      ...scheduling.beforeDoubleDegree.map((rule) => rule.courseId),
      ...(scheduling.practicalWorkId ? [scheduling.practicalWorkId] : []),
      ...(scheduling.communityService?.companionIds ?? []),
    ];
    for (const id of ids) expect(getCourse(curriculum.id, id)).toBeDefined();
    expect(scheduling.electiveSemesterStep).toBeGreaterThan(0);
  });
}

test("precomputed runtime data matches source adapters and preserves shared course identity", async () => {
  const { registry } = await import("./registry-data");
  for (const curriculum of listCurricula()) {
    expect(curriculum).toEqual(registry[curriculum.id].curriculum);
    expect(getAcademicRules(curriculum.id)).toEqual(registry[curriculum.id].rules);
    for (const course of [...curriculum.core, ...curriculum.electives]) {
      expect(getCourse(curriculum.id, course.id)).toBe(course);
    }
  }
});
