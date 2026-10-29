import { test, expect } from "@playwright/test";

async function animationFrames(toggle) {
  return toggle.evaluate(
    (button) =>
      new Promise((resolve) => {
        let id = button.getAttribute("aria-controls");
        const frames = [];
        button.click();
        const started = performance.now();
        function sample() {
          id ??= button.getAttribute("aria-controls");
          const element = document.getElementById(id);
          if (!element) {
            resolve(frames);
            return;
          }
          const style = getComputedStyle(element);
          frames.push({
            time: performance.now() - started,
            height: element.getBoundingClientRect().height,
            target: parseFloat(style.getPropertyValue("--radix-accordion-content-height")),
          });
          if (performance.now() - started < 250) requestAnimationFrame(sample);
          else resolve(frames);
        }
        requestAnimationFrame(sample);
      }),
  );
}

test("syllabus toggles animate the full content height without loading another chunk", async ({
  page,
  context,
}) => {
  await context.addCookies([{ name: "g13-language", value: "en", url: "http://127.0.0.1:4173" }]);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?kurikulum=2026&mk=PACS262418");
  const drawer = page.getByRole("dialog");
  const toggle = drawer.getByRole("button", { name: "Syllabus", exact: true });
  await expect(drawer.getByRole("heading", { name: "References", exact: true })).toBeVisible();
  const region = drawer.getByRole("region");
  const loadedHeight = await region.evaluate((element) => element.scrollHeight);
  const requests = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") requests.push(request.url());
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    const closing = await animationFrames(toggle);
    await expect(region).toBeHidden();
    const opening = await animationFrames(toggle);
    await expect(region).toBeVisible();
    for (const frames of [closing, opening]) {
      const during = frames.filter((frame) => frame.time < 180);
      expect(during.length).toBeGreaterThan(0);
      for (const frame of during) expect(Math.abs(frame.target - loadedHeight)).toBeLessThan(2);
    }
    expect(
      opening.some(
        (frame) =>
          frame.time < 180 &&
          frame.height > loadedHeight * 0.2 &&
          frame.height < loadedHeight * 0.95,
      ),
    ).toBe(true);
    await expect(drawer.getByText("Loading syllabus…", { exact: true })).toHaveCount(0);
  }
  expect(requests).toEqual([]);
});
