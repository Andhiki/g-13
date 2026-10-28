import { expect, test } from "bun:test";
import { semesterRelations } from "./semester-relations";

test("graph connections omit same-semester prerequisites without changing the source relations", () => {
  const relations = [
    { source: "a", target: "b" },
    { source: "a", target: "c" },
    { source: "a", target: "elective" },
    { source: "elective", target: "unscheduled" },
  ];
  const semesters = new Map([
    ["a", 2],
    ["b", 2],
    ["c", 3],
    ["elective", null],
    ["unscheduled", null],
  ]);
  expect(semesterRelations(relations, semesters)).toEqual(relations.slice(1));
  expect(relations).toHaveLength(4);
  expect(
    semesterRelations(
      relations,
      new Map([
        ["a", 2],
        ["b", 3],
        ["c", 2],
      ]),
    ),
  ).toEqual([relations[0], relations[2], relations[3]]);
});
