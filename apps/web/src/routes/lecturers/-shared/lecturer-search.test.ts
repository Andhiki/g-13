import { expect, it } from "bun:test";
import { searchLecturers } from "./lecturer-search";
const courses = [
  { id: "db", code: "CS101", nameId: "Basis Data", nameEn: "Database Systems" },
  { id: "alg", code: "CS102", nameId: "Algoritma", nameEn: "Algorithms" },
];
const lecturers = [
  { name: "Afiahayati", courses: [{ courseId: "db" }, { courseId: "alg" }] },
  { name: "Ahmad Ashari", courses: [{ courseId: "alg" }] },
  { name: "No Reviews", courses: [] },
];
it("matches lecturer names and a course code or either language", () => {
  expect(searchLecturers(lecturers, courses, "AFIA").map((p) => p.name)).toEqual(["Afiahayati"]);
  for (const query of ["basis data", "DATABASE SYSTEMS", "cs101"]) {
    expect(searchLecturers(lecturers, courses, query)).toEqual([
      { name: "Afiahayati", courses: [{ courseId: "db" }] },
    ]);
  }
  expect(searchLecturers(lecturers, courses, "No Reviews").map((p) => p.name)).toEqual([
    "No Reviews",
  ]);
});
it("combines names with course terms and retains only matching course summaries", () => {
  expect(searchLecturers(lecturers, courses, "Afiahayati di basis data")).toEqual([
    { name: "Afiahayati", courses: [{ courseId: "db" }] },
  ]);
  expect(searchLecturers(lecturers, courses, "Afiahayati di mata kuliah basis data")).toEqual([
    { name: "Afiahayati", courses: [{ courseId: "db" }] },
  ]);
  expect(searchLecturers(lecturers, courses, "Ahmad in algorithms").map((p) => p.name)).toEqual([
    "Ahmad Ashari",
  ]);
  expect(searchLecturers(lecturers, courses, "Ahmad basis data")).toEqual([]);
  expect(searchLecturers(lecturers, courses, "unknown")).toEqual([]);
  expect(searchLecturers(lecturers, courses, " ")).toBe(lecturers);
  expect(lecturers[0].courses).toHaveLength(2);
});
