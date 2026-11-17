import { expect, it } from "bun:test";
import { filterReviewsByCourse, orderLecturers, orderReviews } from "./review-order";
const review = (id: string, courseId: string, overall: number, day: number) => ({
  id,
  courseId,
  overall,
  createdAt: new Date(`2026-11-${String(day).padStart(2, "0")}T00:00:00Z`),
});
const rows = [
  review("old-high", "c1", 5, 1),
  review("new-low", "c1", 1, 3),
  review("mid-high", "c2", 5, 2),
];
it("filters loaded reviews by course and leaves all-course results unchanged", () => {
  expect(filterReviewsByCourse(rows, null)).toEqual(rows);
  expect(filterReviewsByCourse(rows, "c1").map((r) => r.id)).toEqual(["old-high", "new-low"]);
  expect(filterReviewsByCourse(rows, "missing")).toEqual([]);
  expect(rows).toHaveLength(3);
});

it("orders reviews by publication date or equal-weight rating without changing input", () => {
  expect(orderReviews(rows, "newest").map((r) => r.id)).toEqual([
    "new-low",
    "mid-high",
    "old-high",
  ]);
  expect(orderReviews(rows, "oldest").map((r) => r.id)).toEqual([
    "old-high",
    "mid-high",
    "new-low",
  ]);
  expect(orderReviews(rows, "highest").map((r) => r.id)).toEqual([
    "mid-high",
    "old-high",
    "new-low",
  ]);
  expect(orderReviews(rows, "lowest").map((r) => r.id)).toEqual([
    "new-low",
    "mid-high",
    "old-high",
  ]);
  expect(rows[0].id).toBe("old-high");
});
it("orders lecturers by name, review count, and rating with unrated entries last", () => {
  const lecturers = [
    { id: "z", name: "Zara", reviewCount: 3, overallAverage: 11 / 3 },
    { id: "a", name: "Ari", reviewCount: 1, overallAverage: 4 },
    { id: "b", name: "Budi", reviewCount: 0, overallAverage: null },
  ];
  const ids = (order: "name" | "review-count" | "rating") =>
    orderLecturers(lecturers, order).map((p) => p.id);
  expect(ids("name")).toEqual(["a", "b", "z"]);
  expect(ids("review-count")).toEqual(["z", "a", "b"]);
  expect(ids("rating")).toEqual(["a", "z", "b"]);
  expect(lecturers[0].reviewCount).toBe(3);
});
