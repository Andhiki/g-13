import { expect, test } from "bun:test";
import { courseMotion } from "./map-motion";

test("courses curve around the selected card in both directions without changing endpoints", () => {
  const selected = { x: 420, y: 300 };
  for (const [start, end] of [
    [
      { x: 60, y: 300 },
      { x: 780, y: 300 },
    ],
    [
      { x: 780, y: 350 },
      { x: 60, y: 250 },
    ],
    [
      { x: 420, y: 100 },
      { x: 780, y: 300 },
    ],
    [
      { x: 60, y: 500 },
      { x: 780, y: 300 },
    ],
  ]) {
    const motion = courseMotion(start!, end!, selected);
    expect(motion(0)).toEqual(start!);
    expect(motion(1)).toEqual(end!);
    for (let i = 0; i <= 1000; i++) {
      const point = motion(i / 1000);
      const overlaps =
        Math.abs(point.x - selected.x) < 258 - 0.001 && Math.abs(point.y - selected.y) < 94 - 0.001;
      expect(overlaps).toBe(false);
    }
  }
});

test("clear paths and unfocused layouts keep their direct motion", () => {
  const start = { x: 60, y: 100 };
  const end = { x: 780, y: 100 };
  expect(courseMotion(start, end, { x: 420, y: 300 })(0.5)).toEqual({ x: 420, y: 100 });
  expect(courseMotion(start, end)(0.5)).toEqual({ x: 420, y: 100 });
});
