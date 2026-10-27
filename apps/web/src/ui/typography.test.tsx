import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Typography } from "./typography";

test("defaults to paragraph styling and forwards accessible attributes", () => {
  const html = renderToStaticMarkup(<Typography role="status">Ready</Typography>);
  expect(html).toBe('<p role="status" class="text-paragraph-sm">Ready</p>');
});

test("keeps heading semantics independent of the visual variant", () => {
  const html = renderToStaticMarkup(
    <Typography as="h3" variant="subtitle1" id="courses" className="mt-2 text-text-sub-600">
      Courses
    </Typography>,
  );
  expect(html).toContain('<h3 id="courses"');
  expect(html).toContain("text-label-lg");
  expect(html).toContain("mt-2 text-text-sub-600");
  expect(html).toEndWith("Courses</h3>");
});

test("preserves native label attributes", () => {
  const html = renderToStaticMarkup(
    <Typography as="label" variant="labelSmall" htmlFor="curriculum">
      Curriculum
    </Typography>,
  );
  expect(html).toContain('<label for="curriculum" class="text-label-xs">');
});

test("uses the display font for titles and subtitles without requiring a heading element", () => {
  for (const variant of ["title", "subtitle1", "subtitle2", "graphTitle", "question"] as const) {
    const html = renderToStaticMarkup(<Typography variant={variant}>Title</Typography>);
    expect(html).toContain("font-display");
  }
});

test("uses the display font for semantic headings even with label styling", () => {
  for (const as of ["h1", "h2", "h3", "h4", "h5", "h6"] as const) {
    const html = renderToStaticMarkup(
      <Typography as={as} variant="label">
        Section
      </Typography>,
    );
    expect(html).toContain("font-display");
  }
});

test("uses AlignUI title sizes and permits className size overrides", () => {
  const html = renderToStaticMarkup(
    <Typography variant="graphTitle" className="text-title-h3 mx-auto">
      Title
    </Typography>,
  );
  expect(html).toContain("text-title-h3");
  expect(html).toContain("mx-auto");
  expect(html).not.toContain("text-title-h1");
});
