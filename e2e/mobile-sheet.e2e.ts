import { expect, test } from "@playwright/test";

test("mobile filter stays anchored to the bottom throughout opening", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile);
  await page.goto("/?kurikulum=2026");
  const trigger = page.getByRole("button", { name: "Buka filter kurikulum" });
  for (let attempt = 0; attempt < 5; attempt++) {
    const [frames] = await Promise.all([
      page.evaluate(async () => {
        const frames: { bottom: number; top: number; viewport: number }[] = [];
        let first = 0;
        const start = performance.now();
        while (performance.now() - start < 3000) {
          const dialog = document.querySelector('[role="dialog"]');
          if (dialog) {
            first ||= performance.now();
            if (performance.now() - first > 350) break;
            const rect = dialog.getBoundingClientRect();
            frames.push({ bottom: rect.bottom, top: rect.top, viewport: innerHeight });
          }
          await new Promise(requestAnimationFrame);
        }
        return frames;
      }),
      trigger.tap(),
    ]);
    expect(frames.length).toBeGreaterThan(2);
    expect(frames.every((frame) => frame.bottom >= frame.viewport - 1)).toBe(true);
    expect(frames.at(-1)!.bottom).toBeCloseTo(page.viewportSize()!.height, 0);
    await page.getByRole("button", { name: "Tampilkan mata kuliah" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});

test("mobile course sheet snaps by touch and keyboard and reserves list space", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile);
  await page.goto("/?kurikulum=2026");
  await expect(page.locator(".react-flow__node-course").first()).toBeVisible();
  await page.getByRole("button", { name: "Switch View", exact: true }).click();
  await expect(page.getByLabel("Daftar mata kuliah")).toBeVisible();
  await page
    .getByRole("button", { name: "Buka detail Algoritma dan Struktur Data", exact: true })
    .click();
  const handle = page.getByRole("slider", { name: "Tinggi detail mata kuliah" });
  const dialog = page.getByRole("dialog");
  await expect(handle).toHaveAttribute("aria-valuenow", "45");
  await dialog.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  const client = await page.context().newCDPSession(page);
  const bounds = (await handle.boundingBox())!;
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 8; step++) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y - step * 40 }],
    });
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(handle).toHaveAttribute("aria-valuenow", "85");
  await expect
    .poll(async () => (await dialog.boundingBox())!.height)
    .toBeCloseTo(page.viewportSize()!.height * 0.85, 0);
  await handle.press("ArrowDown");
  await expect(handle).toHaveAttribute("aria-valuenow", "45");
  await handle.press("Home");
  await expect(handle).toHaveAttribute("aria-valuenow", "30");
  await handle.press("End");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect
    .poll(() =>
      page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
        const list = document.querySelector('[aria-label="Daftar mata kuliah"]')!;
        const drawer = document.querySelector('[role="dialog"]')!;
        return Math.round(list.getBoundingClientRect().bottom - drawer.getBoundingClientRect().top);
      }),
    )
    .toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Tutup detail mata kuliah" }).click();
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("button", { name: "Buka detail Algoritma dan Struktur Data", exact: true })
    .click();
  await expect(handle).toHaveAttribute("aria-valuenow", "85");
  await page.setViewportSize({ width: 800, height: 900 });
  await expect(handle).toBeHidden();
  expect((await dialog.boundingBox())!.width).toBeCloseTo(400, 0);
});
