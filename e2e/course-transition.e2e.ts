import { expect, test } from "@playwright/test";

test("following an unlocked course keeps its position through the reveal", async ({ page }) => {
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
  expect(last.zoom).toBeGreaterThan(0);
});

test("opening a course fades out, reveals connections, then draws arrows", async ({ page }) => {
  await page.goto("/?kurikulum=2026");
  await expect(page.locator('[data-id="PACS262201"] button')).toBeVisible();
  const samples = await page.evaluate(async () => {
    const selected = document.querySelector<HTMLElement>('[data-id="PACS262201"]')!;
    const neighbor = document.querySelector<HTMLElement>('[data-id="PACS262526"]')!;
    const initialX = new DOMMatrixReadOnly(neighbor.style.transform).m41;
    const samples: {
      time: number;
      x: number;
      opacity: number;
      edge: number | null;
      selected: number;
    }[] = [];
    selected.querySelector<HTMLButtonElement>("button")!.click();
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const sample = () => {
        const node = document.querySelector<HTMLElement>('[data-id="PACS262526"]')!;
        const edge = document.querySelector<SVGPathElement>(".react-flow__edge-path");
        samples.push({
          time: performance.now() - start,
          x: new DOMMatrixReadOnly(node.style.transform).m41,
          opacity: Number(getComputedStyle(node).opacity),
          edge: edge ? parseFloat(getComputedStyle(edge).strokeDashoffset) : null,
          selected: Number(getComputedStyle(selected).opacity),
        });
        if (performance.now() - start < 1600) requestAnimationFrame(sample);
        else resolve();
      };
      requestAnimationFrame(sample);
    });
    return { initialX, samples };
  });
  const { initialX, samples: frames } = samples;
  expect(
    frames.some((frame) => frame.opacity > 0 && frame.opacity < 1 && frame.x === initialX),
  ).toBe(true);
  expect(frames.some((frame) => frame.opacity === 0 && frame.x === 780)).toBe(true);
  expect(frames.some((frame) => frame.opacity > 0 && frame.opacity < 1 && frame.x === 780)).toBe(
    true,
  );
  expect(
    frames
      .filter((frame) => frame.x !== initialX && frame.opacity > 0)
      .every((frame) => frame.x === 780),
  ).toBe(true);
  expect(
    frames
      .filter((frame) => frame.edge !== null && frame.edge < 1)
      .every((frame) => frame.opacity === 1),
  ).toBe(true);
  expect(frames.some((frame) => frame.edge !== null && frame.edge > 0 && frame.edge < 1)).toBe(
    true,
  );
  expect(frames.every((frame) => frame.selected === 1)).toBe(true);
  expect(frames.at(-1)).toMatchObject({ x: 780, opacity: 1, edge: 0 });
});

test("reduced motion reveals the final connections immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?kurikulum=2026");
  await page.locator('[data-id="PACS262201"] button').click();
  await expect(page.locator('[data-id="PACS262526"]')).toHaveCSS("opacity", "1");
  await expect(page.locator(".react-flow__edge-path").first()).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
});

test("switching and closing during the reveal cancels the previous sequence", async ({ page }) => {
  await page.goto("/?kurikulum=2026");
  const courses = page.locator(".react-flow__node-course");
  await expect(courses.first()).toBeAttached();
  const count = await courses.count();
  await page.locator('[data-id="PACS262201"] button').click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Buka detail Pemrograman", exact: true })
    .click();
  await expect(page).toHaveURL(/mk=PAKF262105/);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1500);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(courses).toHaveCount(count);
  await expect(page.locator(".react-flow__edge-path")).toHaveCount(0);
  expect(
    await courses.evaluateAll((nodes) =>
      nodes.every((node) => getComputedStyle(node).opacity === "1" && !node.hasAttribute("inert")),
    ),
  ).toBe(true);
});
