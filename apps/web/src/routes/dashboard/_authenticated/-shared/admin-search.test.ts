import { describe, expect, test } from "bun:test";
import { adminSearchSegments } from "./admin-search";

describe("adminSearchSegments", () => {
  test("marks every case-insensitive match", () => {
    expect(adminSearchSegments("Aerospace AE ae", "ae")).toEqual([
      { text: "Ae", match: true },
      { text: "rospace ", match: false },
      { text: "AE", match: true },
      { text: " ", match: false },
      { text: "ae", match: true },
    ]);
  });

  test("returns plain text without a needle or match", () => {
    expect(adminSearchSegments("Algoritma", "  ")).toEqual([{ text: "Algoritma", match: false }]);
    expect(adminSearchSegments("Algoritma", "xyz")).toEqual([{ text: "Algoritma", match: false }]);
    expect(adminSearchSegments("", "a")).toEqual([]);
  });

  test("trims the needle like the server", () => {
    expect(adminSearchSegments("IF101", " if1 ")).toEqual([
      { text: "IF1", match: true },
      { text: "01", match: false },
    ]);
  });

  test("folds only ASCII, matching SQLite lower()", () => {
    expect(adminSearchSegments("ÉCOLE", "école")).toEqual([{ text: "ÉCOLE", match: false }]);
    expect(adminSearchSegments("ÉCOLE", "ÉCO")).toEqual([
      { text: "ÉCO", match: true },
      { text: "LE", match: false },
    ]);
  });
});
