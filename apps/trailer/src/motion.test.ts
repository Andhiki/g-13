import { expect, test } from "bun:test";
import { getCourse, getRelations } from "@g13/curriculum";
import { algorithms, analysis, programming } from "./UI";
import { appear, clickScale, cursorMove, tween } from "./motion";

test("cursor travel arrives at rest and curves in its direction of motion", () => {
  const from = [100, 100] as const;
  const to = [600, 400] as const;
  expect(cursorMove(-1, 0, 1, from, to)).toEqual({ x: 100, y: 100, rotate: 0 });
  const arrival = cursorMove(2, 0, 1, from, to);
  expect(arrival.x).toBe(600);
  expect(arrival.y).toBe(400);
  expect(arrival.rotate).toBeCloseTo(0);
  const travel = cursorMove(0.5, 0, 1, from, to);
  expect(travel.rotate).toBeGreaterThan(0);
  expect(travel.y - (100 + (travel.x - 100) * 0.6)).toBeGreaterThan(0);
});

test("each click compresses the cursor, rebounds, and returns to its resting size", () => {
  const clicks = [1, 3];
  for (const click of clicks) {
    expect(clickScale(click - 0.1, clicks)).toBe(1);
    expect(clickScale(click, clicks)).toBeCloseTo(0.76);
    expect(clickScale(click + 0.17, clicks)).toBeCloseTo(1.08);
    expect(clickScale(click + 0.4, clicks)).toBe(1);
  }
});

test("the cursor turns continuously while flying down to the next button", () => {
  let previous = 0;
  for (let frame = 0; frame <= 300; frame++) {
    const { rotate } = cursorMove(frame / 300, 0, 1, [690, 435], [1350, 885], -60);
    expect(Math.abs(rotate - previous)).toBeLessThan(5);
    previous = rotate;
  }
});

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
  expect(relations).toContainEqual(
    expect.objectContaining({ source: programming.code, target: algorithms.code }),
  );
  expect(relations).toContainEqual(
    expect.objectContaining({ source: algorithms.code, target: analysis.code }),
  );
});
