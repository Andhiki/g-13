import { describe, expect, it } from "bun:test";
import { courseDisplayName, matchesCourseSearch } from "./course-search";

const course = {
  code: "TIF221",
  nameId: "Basis Data",
  nameEn: "Database Systems",
};

describe("lecturer review course catalog", () => {
  it("searches the code and both language names regardless of selected language", () => {
    expect(matchesCourseSearch(course, "TIF221")).toBe(true);
    expect(matchesCourseSearch(course, "basis data")).toBe(true);
    expect(matchesCourseSearch(course, "DATABASE SYSTEMS")).toBe(true);
    expect(matchesCourseSearch(course, "algoritma")).toBe(false);
  });

  it("shows the course name in the selected language", () => {
    expect(courseDisplayName(course, "id")).toBe("Basis Data");
    expect(courseDisplayName(course, "en")).toBe("Database Systems");
  });
});
