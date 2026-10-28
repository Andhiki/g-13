import { expect, test } from "bun:test";
import { connectionPath } from "./connection-path";

test("connections keep straight runs and round only the corners", () => {
  const path = connectionPath({ x: 0, y: 40 }, { x: 120, y: 160 }, [
    [0, 40],
    [60, 40],
    [60, 160],
    [120, 160],
  ]);
  expect(path).toContain("L 48,40");
  expect(path).toContain("Q 60,40 60,52");
  expect(path).toContain("L 60,148");
  expect(path).toContain("Q 60,160 72,160");
});
