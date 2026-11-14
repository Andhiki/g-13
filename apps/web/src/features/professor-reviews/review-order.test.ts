import { expect, it } from "bun:test";
import { orderProfessors, orderReviews } from "./review-order";
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
it("orders professors using reviews for the selected course and puts unrated entries last", () => {
  const professors = [
    { id: "z", name: "Zara", reviews: rows },
    { id: "a", name: "Ari", reviews: [review("ari", "c2", 4, 3)] },
    { id: "b", name: "Budi", reviews: [] },
  ];
  const ids = (order: "name" | "review-count" | "rating", course: string | null = null) =>
    orderProfessors(professors, course, order, "newest").map((p) => p.id);
  expect(ids("name")).toEqual(["a", "b", "z"]);
  expect(ids("review-count")).toEqual(["z", "a", "b"]);
  expect(ids("rating")).toEqual(["a", "z", "b"]);
  expect(ids("rating", "c2")).toEqual(["z", "a", "b"]);
  expect(ids("review-count", "c2")).toEqual(["a", "z", "b"]);
  const filtered = orderProfessors(professors, "c1", "rating", "oldest");
  expect(filtered[0].reviews.map((r) => r.id)).toEqual(["old-high", "new-low"]);
  expect(professors[0].reviews).toHaveLength(3);
  expect(ids("rating", "missing")).toEqual(["a", "b", "z"]);
});
