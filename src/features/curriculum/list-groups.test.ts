import { describe, expect, test } from "bun:test";
import { curricula, type Course, type Placement } from "../../data";
import { groupCoursesForList } from "./list-groups";

const base = curricula["2026"].core[0];

function course(id: string, placements: Partial<Placement>[]): Course {
  return {
    ...base,
    id,
    title: id,
    placements: placements.map((placement) => ({ ...base.placements[0], ...placement })),
  };
}

describe("semester table grouping", () => {
  for (const curriculum of Object.values(curricula)) {
    test(`includes every ${curriculum.id} course exactly once without changing the input`, () => {
      const originalIds = curriculum.all.map((item) => item.id);
      const sections = groupCoursesForList(curriculum.all);
      const groupedIds = sections.flatMap((section) => section.courses.map((item) => item.id));

      expect([...groupedIds].sort()).toEqual([...originalIds].sort());
      expect(new Set(groupedIds).size).toBe(curriculum.all.length);
      expect(curriculum.all.map((item) => item.id)).toEqual(originalIds);
    });
  }

  test("uses the earliest core semester and keeps repeated elective placements in one section", () => {
    const required = course("required", [
      { section: "core", semester: 3 },
      { section: "core", semester: 1 },
      { section: "elective", semester: 5 },
    ]);
    const elective = course("elective", [
      { section: "elective", semester: 3 },
      { section: "elective", semester: 5 },
    ]);
    const later = course("later", [{ section: "core", semester: 8 }]);
    const sections = groupCoursesForList([later, elective, required]);

    expect(sections.map((section) => section.title)).toEqual([
      "Semester 1",
      "Semester 8",
      "Mata kuliah pilihan",
    ]);
    expect(sections[0].courses).toEqual([required]);
    expect(sections[2].courses).toEqual([elective]);
    expect(sections[2].courses[0].placements).toHaveLength(2);
  });

  test("retains required courses with no semester and omits empty sections", () => {
    const unassigned = course("unassigned", [{ section: "core", semester: null }]);
    expect(groupCoursesForList([unassigned])).toMatchObject([
      { title: "Semester tidak dinyatakan", courses: [unassigned] },
    ]);
    expect(groupCoursesForList([])).toEqual([]);
  });
});
