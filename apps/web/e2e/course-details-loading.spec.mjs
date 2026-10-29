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
    const drawer = page.getByRole("dialog");
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
    await drawer.getByRole("button", { name: "Close course details", exact: true }).click();
    await expect(drawer).toHaveCount(0);
    await expect(charging).toHaveCount(0);
  });
}
