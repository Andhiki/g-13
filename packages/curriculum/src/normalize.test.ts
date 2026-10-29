import { expect, test } from "bun:test";
import { makePlacement } from "./normalize";

const creditsFor = (value: unknown) =>
  makePlacement("core", "", "", "none", 1, value, "", null).credits;

test("missing and invalid source credits stay unknown instead of becoming zero", () => {
  for (const value of [null, undefined, "", "  ", "unknown", Infinity, -1, true, {}]) {
    expect(creditsFor(value)).toBeNull();
  }
  expect(creditsFor(0)).toBe(0);
  expect(creditsFor("3")).toBe(3);
  expect(creditsFor(4)).toBe(4);
});
