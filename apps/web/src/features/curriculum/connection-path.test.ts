import { expect, test } from "bun:test";
import { connectionPath } from "./connection-path";

const source = { x: 0, y: 40 };
const target = { x: 120, y: 160 };
const points = [
  [0, 40],
  [60, 40],
  [60, 160],
  [120, 160],
];

function samplePath(path: string) {
  let current = [0, 0];
  const samples: number[][] = [];
  for (const command of path.matchAll(/([MLC])\s+([^MLC]+)/g)) {
    const values = command[2]
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (command[1] === "C") {
      for (let step = 0; step <= 20; step++) {
        const t = step / 20;
        samples.push(
          [0, 1].map(
            (axis) =>
              (1 - t) ** 3 * current[axis] +
              3 * (1 - t) ** 2 * t * values[axis] +
              3 * (1 - t) * t ** 2 * values[axis + 2] +
              t ** 3 * values[axis + 4],
          ),
        );
      }
    }
    current = values.slice(-2);
    samples.push(current);
  }
  return samples;
}

test("connections ease out of straight runs with broad bends", () => {
  const path = connectionPath(source, target, points, []);
  expect(path).toStartWith("M 0,40 L 30,40 C");
  expect(path).toEndWith("L 120,160");
  expect(path).not.toContain("Q");
  const curves = Array.from(path.matchAll(/C\s+([^MLC]+)/g), (match) =>
    match[1]
      .trim()
      .split(/[\s,]+/)
      .map(Number),
  );
  expect(curves).toHaveLength(4);
  // The first controls stay on the incoming straight; the last stay on the outgoing one.
  expect(curves[0][1]).toBe(source.y);
  expect(curves[0][3]).toBe(source.y);
  expect(curves[1][0]).toBe(60);
  expect(curves[1][2]).toBe(60);
  expect(curves[1][4]).toBe(60);
  for (const [x, y] of samplePath(path)) {
    expect(x).toBeGreaterThanOrEqual(source.x);
    expect(x).toBeLessThanOrEqual(target.x);
    expect(y).toBeGreaterThanOrEqual(source.y);
    expect(y).toBeLessThanOrEqual(target.y);
  }
});

test("bends tighten near cards instead of cutting through them", () => {
  const obstacle = { position: { x: 30, y: 52 }, measured: { width: 18, height: 20 } };
  const path = connectionPath(source, target, points, [obstacle]);
  expect(path).toStartWith("M 0,40 L 48,40 C");
  for (const [x, y] of samplePath(path)) {
    expect(x > 30 && x < 48 && y > 52 && y < 72).toBe(false);
  }
});

test("short and reversed runs stay finite and within their routes", () => {
  const path = connectionPath(
    { x: 12, y: 10 },
    { x: 0, y: 0 },
    [
      [6, 10],
      [6, 0],
    ],
    [],
  );
  for (const [x, y] of samplePath(path)) {
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThanOrEqual(12);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThanOrEqual(10);
  }
});

test("straight and duplicate points need no bends", () => {
  expect(
    connectionPath(
      source,
      { x: 120, y: 40 },
      [
        [0, 40],
        [60, 40],
        [60, 40],
      ],
      [],
    ),
  ).toBe("M 0,40 L 120,40");
  expect(connectionPath(source, source, [[0, 40]], [])).toBe("M 0,40 L 0,40");
});
