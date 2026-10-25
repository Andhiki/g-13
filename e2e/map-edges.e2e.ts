import { expect, test } from "@playwright/test";

test("focus gathers connections, follows neighbors, and restores semester filters", async ({
  page,
  isMobile,
}) => {
  await page.goto("/?kurikulum=2026");
  await page.getByRole("button", { name: "Semester 2", exact: true }).click();
  const count = await page.locator(".react-flow__node-course").count();
  const selected = page.locator('[data-id="PACS262201"]');
  const original = await selected.getAttribute("style");
  await selected.getByRole("button").click();
  await expect(page.locator(".course-node.unrelated")).toHaveCount(0);
  await expect(page.locator(".map-lane")).toHaveCount(0);
  await expect(page.locator(".course-node.prerequisite").first()).toBeVisible();
  await expect(page.locator(".course-node.dependent").first()).toBeVisible();
  expect(await selected.getAttribute("style")).toBe(original);
  await expect
    .poll(() =>
      page.locator(".react-flow__node-course").evaluateAll((nodes) =>
        nodes.every((node) => {
          const rect = node.getBoundingClientRect();
          return (
            rect.left >= (innerWidth < 650 ? 0 : 400) &&
            rect.right <= innerWidth &&
            rect.top >= 96 &&
            rect.bottom <= innerHeight * (innerWidth < 650 ? 0.55 : 1)
          );
        }),
      ),
    )
    .toBe(true);
  await page.locator(".course-node.prerequisite button").first().click();
  await expect(page).not.toHaveURL(/mk=PACS262201/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".react-flow__node-course")).toHaveCount(count);
  await expect(page.getByRole("button", { name: "Semester 2", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await selected.getByRole("button").click();
  await page.getByRole("button", { name: "Semester 3", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/?kurikulum=2026&mk=PACS262201");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator(".react-flow__pane").click({
    position: {
      x: isMobile ? 10 : page.viewportSize()!.width - 10,
      y: isMobile ? 300 : page.viewportSize()!.height - 100,
    },
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("course gathering eases out without overshoot and respects reduced motion", async ({
  page,
}) => {
  await page.goto("/?kurikulum=2026");
  const optional = page.locator('[data-id="PACS262526"]');
  await expect(optional).toBeAttached();
  const samples = await page.evaluate(async () => {
    const node = document.querySelector<HTMLElement>('[data-id="PACS262526"]')!;
    const samples: { time: number; x: number }[] = [];
    const start = performance.now();
    const initialX = new DOMMatrixReadOnly(node.style.transform).m41;
    let movingSince: number | undefined;
    document.querySelector<HTMLButtonElement>('[data-id="PACS262201"] button')!.click();
    await new Promise<void>((resolve) => {
      const sample = () => {
        const x = new DOMMatrixReadOnly(node.style.transform).m41;
        if (x !== initialX && movingSince === undefined) movingSince = performance.now();
        const elapsed = movingSince === undefined ? 0 : performance.now() - movingSince;
        samples.push({ time: elapsed, x });
        if (elapsed < 1500 && performance.now() - start < 4000) requestAnimationFrame(sample);
        else resolve();
      };
      requestAnimationFrame(sample);
    });
    return samples;
  });
  const finalX = 780;
  const initialX = samples[0]!.x;
  const at400 = samples.find((sample) => sample.time >= 400)!.x;
  expect(initialX - at400).toBeGreaterThan((initialX - finalX) * 0.5);
  expect(at400 - finalX).toBeGreaterThan(1);
  expect(Math.min(...samples.map((sample) => sample.x))).toBeGreaterThanOrEqual(finalX - 0.01);
  expect(samples.at(-1)!.x).toBeCloseTo(finalX);
  expect(
    samples
      .filter((sample) => sample.time >= 1250)
      .every((sample) => Math.abs(sample.x - finalX) < 0.01),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Tutup detail mata kuliah" }).click();
  const immediateX = await page.evaluate(async () => {
    document.querySelector<HTMLButtonElement>('[data-id="PACS262201"] button')!.click();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    return new DOMMatrixReadOnly(
      document.querySelector<HTMLElement>('[data-id="PACS262526"]')!.style.transform,
    ).m41;
  });
  expect(immediateX).toBe(finalX);
});
