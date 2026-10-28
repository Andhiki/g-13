import { expect, test } from "@playwright/test";

test("list scroll updates do not interrupt an active sheet drag", async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?kurikulum=2026");
  await page.getByRole("button", { name: "Switch View", exact: true }).click();
  await page
    .getByRole("button", { name: "Buka detail Algoritma dan Struktur Data", exact: true })
    .click();
  const handle = page.getByRole("slider", { name: "Tinggi detail mata kuliah" });
  await expect(handle).toBeVisible();
  const bounds = (await handle.boundingBox())!;
  const x = bounds.x + bounds.width / 2;
  await page.mouse.move(x, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, bounds.y - 120, { steps: 4 });
  await page.evaluate(() => window.scrollTo(0, 900));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  await page.mouse.move(x, bounds.y - 360, { steps: 6 });
  await page.mouse.up();
  await expect(handle).toHaveAttribute("aria-valuenow", "75");
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe("");
});

test("mobile sheet drags from its content and retains expanded scrolling", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?kurikulum=2026&mk=PACS262201");
  const sheet = page.getByRole("dialog");
  const handle = page.getByRole("slider", { name: "Tinggi detail mata kuliah" });
  await expect(sheet).toBeVisible();
  const session = await page.context().newCDPSession(page);
  const swipe = async (x: number, from: number, to: number) => {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y: from }],
    });
    for (let step = 1; step <= 12; step++) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: from + ((to - from) * step) / 12 }],
      });
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  // Start on the title area rather than the handle.
  await swipe(160, 660, 300);
  await expect(handle).toHaveAttribute("aria-valuenow", "75");
  await page.getByRole("button", { name: "Silabus", exact: true }).click();
  await expect(sheet.getByText(/Disjoint Set/)).toBeVisible();
  const body = sheet.locator("div.overflow-y-auto");
  await swipe(200, 650, 350);
  await expect.poll(() => body.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await expect(handle).toHaveAttribute("aria-valuenow", "75");
  // Stop the previous fling before resetting the content for the downward drag.
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 200, y: 650 }],
  });
  await session.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  await body.evaluate((el) => {
    el.scrollTop = 0;
  });
  await swipe(160, 440, 790);
  await expect(handle).toHaveAttribute("aria-valuenow", "30");
  await handle.focus();
  await page.keyboard.press("End");
  await expect(handle).toHaveAttribute("aria-valuenow", "75");
});

test("favicon is served as an SVG icon", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/favicon.svg");
  const response = await request.get("/favicon.svg");
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain("<svg");
});
