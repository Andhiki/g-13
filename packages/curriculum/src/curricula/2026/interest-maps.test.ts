import { expect, test } from "bun:test";
import maps from "../../../../../output/data/ugm-ilkom-2026-interest-maps.json";
import table from "./source.json";

test("six visually transcribed interest maps retain every required-interest table course", () => {
  expect(maps.interest_maps.map((map) => map.source.pdf_page)).toEqual([
    201, 202, 203, 204, 205, 206,
  ]);
  expect(maps.interest_maps.map((map) => map.required_interest_credits)).toEqual([
    9, 10, 15, 12, 12, 15,
  ]);
  expect(maps.interest_maps.reduce((count, map) => count + map.courses.length, 0)).toBe(57);
  for (const map of maps.interest_maps) {
    const rows = table.course_schedule.interest_area_rows.filter(
      (row) => row.interest_area_raw === map.interest_area,
    );
    expect(
      map.courses
        .filter((row) => row.role === "WM")
        .map((row) => row.course_code)
        .sort(),
    ).toEqual(
      rows
        .filter((row) => row.course_type_raw === "WM")
        .map((row) => row.course_code_raw)
        .sort(),
    );
    expect(new Set(map.courses.map((row) => row.course_code)).size).toBe(map.courses.length);
    for (const course of map.courses) {
      expect(rows.some((row) => row.course_code_raw === course.course_code)).toBe(true);
      expect(course.semester).toBeGreaterThanOrEqual(3);
      expect(course.semester).toBeLessThanOrEqual(7);
      expect(course.credits).toBeGreaterThan(0);
    }
    expect(map.source.pdf_page - map.source.printed_page).toBe(18);
  }
});

test("diagram/table conflicts are kept explicit instead of overwriting table data", () => {
  const digital = maps.interest_maps.find((map) => map.interest_area === "Wirausaha Digital")!;
  const capacity = digital.courses.find((row) => row.course_code === "PACS262506")!;
  const capacityTable = table.course_schedule.interest_area_rows.find(
    (row) => row.course_code_raw === capacity.course_code,
  )!;
  expect(capacity.credits).toBe(2);
  expect(capacityTable.credits_total).toBe(3);
  expect(digital.differences_from_table).toContainEqual({
    course_code: "PACS262506",
    field: "credits",
    diagram_value: 2,
    table_value: 3,
  });
  expect(
    maps.interest_maps.reduce(
      (count, map) => count + map.table_courses_not_named_in_diagram.length,
      0,
    ),
  ).toBe(7);
});
