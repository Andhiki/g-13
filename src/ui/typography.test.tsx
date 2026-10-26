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
  expect(html).toContain("text-label-lg mt-2 text-text-sub-600");
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
