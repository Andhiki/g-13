import { expect, it } from "bun:test";
import { lecturerOrders, orderLecturers, type LecturerOrder } from "./review-order";
import { defaultLecturerOrder, validateLecturerSearch } from "./search";

it("accepts each directory sort and omits the default from the search state", () => {
  for (const sort of lecturerOrders) {
    expect(validateLecturerSearch({ sort })).toEqual(sort === defaultLecturerOrder ? {} : { sort });
  }
  for (const sort of [undefined, null, 1, ["rating"], "unknown"]) {
    expect(validateLecturerSearch({ sort })).toEqual({});
  }
  expect(validateLecturerSearch({})).toEqual({});
});

const lecturers = [
  { id: "b2", name: "Budi", reviewCount: 4, overallAverage: 4 },
  { id: "a", name: "Ayu", reviewCount: 4, overallAverage: 4 },
  { id: "c", name: "Citra", reviewCount: 0, overallAverage: null },
  { id: "b1", name: "Budi", reviewCount: 4, overallAverage: 4 },
  { id: "d", name: "Dewi", reviewCount: 2, overallAverage: 2 },
];

const expectedOrders = {
  name: ["a", "b1", "b2", "c", "d"],
  "name-desc": ["d", "c", "b1", "b2", "a"],
  reviews: ["a", "b1", "b2", "d", "c"],
  "reviews-asc": ["c", "d", "a", "b1", "b2"],
  rating: ["a", "b1", "b2", "d", "c"],
  "rating-asc": ["d", "a", "b1", "b2", "c"],
} satisfies Record<LecturerOrder, string[]>;

it.each(lecturerOrders)("sorts lecturers by %s with deterministic ties", (order) => {
  expect(orderLecturers(lecturers, order).map(({ id }) => id)).toEqual(expectedOrders[order]);
});
