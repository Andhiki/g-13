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

for (const offset of [-12, 0, 12]) {
  test(`offset ${offset}: shared endpoints retain horizontal approaches without doubling back`, () => {
    const path = connectionPath(source, target, points, offset);
    expect(path).toStartWith("M0,40M 0,40Q0,40 8,40Q16,40");
    expect(path).toEndWith("Q120,160 120,160");
    expect(path).toContain("Q104,160 112,160");
  });
}

test("offsets separate the interior routes", () => {
  expect(connectionPath(source, target, points, -12)).not.toBe(
    connectionPath(source, target, points, 12),
  );
});
