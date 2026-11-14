import { expect, it } from "bun:test";
import { searchProfessors } from "./professor-search";
const courses = [
  { id: "db", code: "CS101", nameId: "Basis Data", nameEn: "Database Systems" },
  { id: "alg", code: "CS102", nameId: "Algoritma", nameEn: "Algorithms" },
];
const professors = [
  { name: "Afiahayati", reviews: [{ courseId: "db" }, { courseId: "alg" }] },
  { name: "Ahmad Ashari", reviews: [{ courseId: "alg" }] },
  { name: "No Reviews", reviews: [] },
];
it("matches professor names and a course code or either language", () => {
  expect(searchProfessors(professors, courses, "AFIA").map((p) => p.name)).toEqual(["Afiahayati"]);
  for (const query of ["basis data", "DATABASE SYSTEMS", "cs101"]) {
    expect(searchProfessors(professors, courses, query)).toEqual([
      { name: "Afiahayati", reviews: [{ courseId: "db" }] },
    ]);
  }
  expect(searchProfessors(professors, courses, "No Reviews").map((p) => p.name)).toEqual([
    "No Reviews",
  ]);
});
it("combines names with course terms and retains only matching published review references", () => {
  expect(searchProfessors(professors, courses, "Afiahayati di basis data")).toEqual([
    { name: "Afiahayati", reviews: [{ courseId: "db" }] },
  ]);
  expect(searchProfessors(professors, courses, "Afiahayati di mata kuliah basis data")).toEqual([
    { name: "Afiahayati", reviews: [{ courseId: "db" }] },
  ]);
  expect(searchProfessors(professors, courses, "Ahmad in algorithms").map((p) => p.name)).toEqual([
    "Ahmad Ashari",
  ]);
  expect(searchProfessors(professors, courses, "Ahmad basis data")).toEqual([]);
  expect(searchProfessors(professors, courses, "unknown")).toEqual([]);
  expect(searchProfessors(professors, courses, " ")).toBe(professors);
  expect(professors[0].reviews).toHaveLength(2);
});
