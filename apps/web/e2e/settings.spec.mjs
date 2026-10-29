import { test, expect } from "@playwright/test";

test.use({ locale: "en", reducedMotion: "reduce" });

async function openSettings(page) {
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  return page.getByRole("dialog", { name: "Settings", exact: true });
}

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "g13-language", value: "en", url: "http://127.0.0.1:4173" }]);
});

test("settings persist and apply across the app", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/resources");
  const dialog = await openSettings(page);
  const theme = dialog.getByRole("tablist", { name: "Theme", exact: true });
  await expect(theme.getByRole("tab", { name: "System" })).toHaveAttribute("aria-selected", "true");
  await theme.getByRole("tab", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await openSettings(page);
  await expect(theme.getByRole("tab", { name: "Dark", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await theme.getByRole("tab", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await theme.getByRole("tab", { name: "System" }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass(/light/);

  const cursor = dialog.getByRole("tablist", { name: "Button and link cursor" });
  const link = dialog.getByRole("link", { name: "Help make it better! 🍵" });
  await expect(link).toHaveAttribute("href", "https://github.com/Andhiki/g-13");
  await expect(link).toHaveCSS("cursor", "default");
  await cursor.getByRole("tab", { name: "Pointer", exact: true }).click();
  await expect(link).toHaveCSS("cursor", "pointer");
  await expect(cursor.getByRole("tab", { name: "Normal", exact: true })).toHaveCSS(
    "cursor",
    "pointer",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeFocused();
  await expect(page.getByRole("link", { name: "Exam archive", exact: true })).toHaveCSS(
    "cursor",
    "pointer",
  );
  await page.getByRole("link", { name: "Exam archive", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Settings", exact: true })).toHaveCSS(
    "cursor",
    "pointer",
  );
  await openSettings(page);
  await expect(cursor.getByRole("tab", { name: "Pointer", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await cursor.getByRole("tab", { name: "Normal", exact: true }).click();
  await expect(link).toHaveCSS("cursor", "default");
  await page.reload();
  await expect(page.getByRole("button", { name: "Settings", exact: true })).toHaveCSS(
    "cursor",
    "default",
  );
});

test("mobile settings support keyboard selection and nested modal dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/resources");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const dialog = await openSettings(page);
  const bounds = await dialog.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(375);
  await dialog.getByRole("tab", { name: "Normal", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByRole("tab", { name: "Pointer", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("dialog", { name: "App navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
});
