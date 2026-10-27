import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SemesterIndicator } from "./SemesterIndicator";

test("marks the recommended semester on an eight-semester line", () => {
  for (const semester of [1, 4, 8]) {
    const html = renderToStaticMarkup(<SemesterIndicator label={`Semester ${semester}`} />);
    expect(html).toContain(`aria-label="Semester anjuran ${semester} dari 8 semester"`);
    expect(html.match(/rounded-full border-2/g)).toHaveLength(8);
    expect(html.match(/rotate-45/g)).toHaveLength(1);
    expect(html.match(/rotate-45.*?text-text-strong-950">([1-8])<\/span>/)?.[1]).toBe(
      String(semester),
    );
    expect(html).not.toContain('role="slider"');
  }
});

test("preserves ranges, multiple placements and unspecified semesters as text", () => {
  for (const label of ["Semester 5-8", "Semester 3 / 4", "Semester tidak dinyatakan"]) {
    const html = renderToStaticMarkup(<SemesterIndicator label={label} />);
    expect(html).toContain(label);
    expect(html).not.toContain('role="img"');
  }
});
