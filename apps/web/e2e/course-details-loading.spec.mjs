import { test, expect } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`course drawer keeps its shell and charging animation after loading at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await context.addCookies([{ name: "g13-language", value: "en", url: "http://127.0.0.1:4173" }]);
    let release;
    const pending = new Promise((resolve) => {
      release = resolve;
    });
    await page.route("**/CourseDetailsPanel-*.js", async (route) => {
      const response = await route.fetch();
      await pending;
      await route.fulfill({ response });
    });
    await page.goto("/?kurikulum=2026");
    await page.waitForFunction(
      () => document.querySelector('[aria-keyshortcuts="D"]')?.disabled === false,
    );
    await page.getByRole("button", { name: "Search courses", exact: true }).click();
    await page.getByRole("combobox").fill("PACS262418");
    await page.getByRole("option").filter({ hasText: "PACS262418" }).click();
    const drawer = page.getByRole("dialog").filter({
      has: page.getByRole("button", { name: "Close course details", exact: true }),
    });
    try {
      await expect(drawer.getByRole("status")).toBeVisible();
      await drawer.getByRole("button", { name: "Close course details", exact: true }).focus();
      await drawer.evaluate((element) => {
        window.loadingDrawer = element;
      });
    } finally {
      release();
    }
    await expect(drawer.getByRole("heading", { name: "References", exact: true })).toBeVisible();
    expect(await drawer.evaluate((element) => element === window.loadingDrawer)).toBe(true);
    await expect(
      drawer.getByRole("button", { name: "Close course details", exact: true }),
    ).toBeFocused();
    await page.mouse.move(width - 5, 65);
    const charging = page.locator(".course-connection-charge");
    await expect(charging.first()).toBeVisible();
    expect(
      await charging.first().evaluate((element) => getComputedStyle(element).animationPlayState),
    ).toBe("running");
    if (width === 390) {
      const slider = drawer.getByRole("slider");
      await slider.focus();
      await slider.press("ArrowUp");
      await expect(slider).toHaveAttribute("aria-valuenow", "75");
      await slider.press("Home");
      await expect(slider).toHaveAttribute("aria-valuenow", "30");
      await expect(drawer).toHaveCSS("height", "300px");
      const handle = await slider.boundingBox();
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await page.mouse.down();
      await page.mouse.move(handle.x + handle.width / 2, handle.y - 450, { steps: 10 });
      await page.mouse.up();
      await expect(slider).toHaveAttribute("aria-valuenow", "75");
      await expect
        .poll(() => drawer.evaluate((element) => element.getBoundingClientRect().height))
        .toBe(750);
    }
    await drawer.getByRole("button", { name: "Close course details", exact: true }).click();
    await expect(drawer).toHaveCount(0);
    await expect(charging).toHaveCount(0);
  });
}
