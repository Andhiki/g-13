import { expect, test } from "bun:test";
import { curriculumIds } from "./ids";
import { registry } from "./registry-data";
import {
  allowsDoubleDegreeWithoutInterest,
  curriculumCourseIds,
  curriculumElectiveIds,
  curriculumInterestNames,
  internshipOptionValues,
  isCurriculumCourse,
  hasCurriculumInterest,
} from "./search-index";

test.each(curriculumIds)("search params project the %s registry slice", (id) => {
  const { curriculum, rules } = registry[id];
  expect(curriculumCourseIds(id)).toEqual(curriculum.all.map((course) => course.id));
  expect(curriculumInterestNames(id)).toEqual(
    curriculum.groups.filter((group) => group.kind === "interest").map((group) => group.name),
  );
  expect(curriculumElectiveIds(id)).toEqual(
    curriculum.electives
      .filter(
        (course) =>
          course.code &&
          course.placements.some(
            (placement) => placement.groupKind === "interest" || placement.groupKind === "elective",
          ),
      )
      .map((course) => course.id),
  );
  expect(allowsDoubleDegreeWithoutInterest(id)).toBe(rules.doubleDegreeWithoutInterest);
  expect(internshipOptionValues(id)).toEqual(
    rules.internship.kind === "credited" ? rules.internship.options.map((x) => x.value) : [],
  );
});

test("course and interest lookups reject values from the other curriculum", () => {
  expect(isCurriculumCourse("2026", "PACS262101")).toBe(true);
  expect(isCurriculumCourse("2026", "MII21-1203")).toBe(false);
  expect(isCurriculumCourse("2021", "MII21-1203")).toBe(true);
  expect(hasCurriculumInterest("2026", curriculumInterestNames("2026")[0])).toBe(true);
  expect(hasCurriculumInterest("2026", "Tidak Ada")).toBe(false);
});
