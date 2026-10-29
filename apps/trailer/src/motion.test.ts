import { expect, test } from "bun:test";
import { getCourse, getRelations } from "@g13/curriculum";
import { algorithms, analysis, programming } from "./UI";
import { appear, tween } from "./motion";

test("camera movement holds its endpoints outside the shot", () => {
  expect(tween(-1, 1, 2, 40, 100)).toBe(40);
  expect(tween(3, 1, 2, 40, 100)).toBe(100);
  expect(tween(1.5, 1, 2, 40, 100)).toBeGreaterThan(40);
  expect(tween(1.5, 1, 2, 40, 100)).toBeLessThan(100);
});

test("a shot is visible between its entrance and exit", () => {
  expect(appear(-1, 0, 6)).toBe(0);
  expect(appear(2, 0, 6)).toBe(1);
  expect(appear(7, 0, 6)).toBe(0);
});

test("illustrated cards and connections match curriculum 2026", () => {
  for (const card of [programming, algorithms, analysis]) {
    const course = getCourse("2026", card.code);
    expect(course?.title).toBe(card.title);
    expect(course?.placements.some((placement) => placement.credits === card.credits)).toBe(true);
  }
  const relations = getRelations("2026");
  expect(relations).toContainEqual({ source: programming.code, target: algorithms.code });
  expect(relations).toContainEqual({ source: algorithms.code, target: analysis.code });
});
