import { expect, test } from "bun:test";
import { registry } from "./registry-data";
import { indexCourseTitles, resolvePrerequisites } from "./relations";

const template = registry["2021"].curriculum.core[0];
const source = { ...template, id: "source", title: "Algoritma" };
const other = { ...template, id: "other", title: "Matematika" };
const target = {
  ...template,
  id: "target",
  placements: [
    { ...template.placements[0], prerequisiteRaw: "Algoritma*\nMatematika; 24 SKS, Tidak dikenal" },
  ],
};

test("prerequisite names, timing, and unresolved text use the same parser", () => {
  const result = resolvePrerequisites(target, indexCourseTitles([source, other, target]), true);
  expect(result.relations).toEqual([
    { source: "source", target: "target", timing: "concurrent" },
    { source: "other", target: "target", timing: "before" },
  ]);
  expect(result.unresolved).toEqual(["24 SKS", "Tidak dikenal"]);
  expect(
    resolvePrerequisites(target, indexCourseTitles([source, other, target]), false).relations.every(
      (r) => r.timing === "before",
    ),
  ).toBe(true);
});

test("an unstarred placement takes precedence over a concurrent placement", () => {
  const course = {
    ...target,
    placements: [
      { ...template.placements[0], prerequisiteRaw: "Algoritma" },
      { ...template.placements[0], prerequisiteRaw: "Algoritma*" },
    ],
  };
  expect(resolvePrerequisites(course, indexCourseTitles([source, course]), true).relations).toEqual(
    [{ source: "source", target: "target", timing: "before" }],
  );
});
