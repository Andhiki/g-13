import { expect, test } from "@playwright/test";

test("following an unlocked course keeps its position and moves the camera directly", async ({
  page,
}) => {
  await page.goto("/?kurikulum=2026&mk=PACS262201");
  await expect(page.locator('[data-id="PACS262302"] button')).toBeVisible();
  await page.waitForTimeout(1400);
  const samples = await page.evaluate(async () => {
    const node = document.querySelector<HTMLElement>('[data-id="PACS262302"]')!;
    const viewport = document.querySelector<HTMLElement>(".react-flow__viewport")!;
    const read = () => ({
      x: new DOMMatrixReadOnly(node.style.transform).m41,
      y: new DOMMatrixReadOnly(node.style.transform).m42,
      zoom: new DOMMatrixReadOnly(viewport.style.transform).a,
    });
    const samples = [read()];
    node.querySelector<HTMLButtonElement>("button")!.click();
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const sample = () => {
        samples.push(read());
        if (performance.now() - start < 1600) requestAnimationFrame(sample);
        else resolve();
      };
      requestAnimationFrame(sample);
    });
    return samples;
  });
  await expect(page).toHaveURL(/mk=PACS262302/);
  const first = samples[0]!;
  const last = samples.at(-1)!;
  expect(
    samples.every(({ x, y }) => Math.abs(x - first.x) < 0.1 && Math.abs(y - first.y) < 0.1),
  ).toBe(true);
  expect(Math.min(...samples.map(({ zoom }) => zoom))).toBeGreaterThanOrEqual(
    Math.min(first.zoom, last.zoom) - 0.001,
  );
  expect(Math.max(...samples.map(({ zoom }) => zoom))).toBeLessThanOrEqual(
    Math.max(first.zoom, last.zoom) + 0.001,
  );
});

test("gathering courses avoid the selected card", async ({ page }) => {
  await page.goto("/?kurikulum=2026");
  await expect(page.locator('[data-id="PAKF262106"]')).toBeAttached();
  const collisions = await page.evaluate(async () => {
    const selected = document.querySelector<HTMLElement>('[data-id="PAKF262106"]')!;
    selected.querySelector<HTMLButtonElement>("button")!.click();
    const collisions: string[] = [];
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const sample = () => {
        const a = selected.getBoundingClientRect();
        for (const node of document.querySelectorAll<HTMLElement>(".react-flow__node-course")) {
          if (node === selected) continue;
          const b = node.getBoundingClientRect();
          if (
            a.left < b.right - 1 &&
            a.right > b.left + 1 &&
            a.top < b.bottom - 1 &&
            a.bottom > b.top + 1
          ) {
            collisions.push(node.dataset.id!);
          }
        }
        if (performance.now() - start < 1500) requestAnimationFrame(sample);
        else resolve();
      };
      requestAnimationFrame(sample);
    });
    return collisions;
  });
  expect(collisions).toEqual([]);
});
