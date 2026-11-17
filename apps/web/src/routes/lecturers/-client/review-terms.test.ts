import { expect, test } from "bun:test";
import { reviewTerms } from "./review-terms";

test("includes every semester from 2021/2022 through November 2026", () => {
  expect(reviewTerms(new Date(2026, 10, 10))).toEqual([
    "2021/2022 Ganjil",
    "2021/2022 Genap",
    "2022/2023 Ganjil",
    "2022/2023 Genap",
    "2023/2024 Ganjil",
    "2023/2024 Genap",
    "2024/2025 Ganjil",
    "2024/2025 Genap",
    "2025/2026 Ganjil",
    "2025/2026 Genap",
    "2026/2027 Ganjil",
  ]);
});

test("bounds the list at semester and academic-year transitions", () => {
  expect(reviewTerms(new Date(2021, 6, 31))).toEqual([]);
  expect(reviewTerms(new Date(2021, 7, 1))).toEqual(["2021/2022 Ganjil"]);
  expect(reviewTerms(new Date(2027, 0, 31)).at(-1)).toBe("2026/2027 Ganjil");
  expect(reviewTerms(new Date(2027, 1, 1)).at(-1)).toBe("2026/2027 Genap");
  expect(reviewTerms(new Date(2027, 6, 31)).at(-1)).toBe("2026/2027 Genap");
  expect(reviewTerms(new Date(2027, 7, 1)).at(-1)).toBe("2027/2028 Ganjil");
});
