import { expect, test } from "@playwright/test";

test("theme reveal switches both ways and persists the selected theme", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const root = page.locator("html");
  const trigger = page.getByRole("button", { name: /Ganti ke tema/ });
  for (const label of ["Gelap", "Terang", "Gelap", "Terang"]) {
    await trigger.click();
    await expect(root).toHaveClass(/theme-transition/);
    expect(
      await root.evaluate(
        (element) => getComputedStyle(element, "::view-transition-new(root)").animationDuration,
      ),
    ).toBe("2s");
    await expect(page.getByRole("menu", { name: "Pilih tema tampilan" })).toHaveCount(0);
    await expect(root).toHaveClass(label === "Gelap" ? /dark/ : /light/);
    await expect(root).not.toHaveClass(/theme-transition/);
    await expect(trigger).toBeFocused();
  }
  await page.reload();
  await expect(trigger).toHaveAttribute("title", "Ganti ke tema gelap (D)");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(root).toHaveClass(/light/);
});

test("D toggles the theme and ignores typing and modified shortcuts", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Ganti ke tema/ })).toBeEnabled();
  const root = page.locator("html");
  await page.keyboard.press("d");
  await expect(root).toHaveClass(/dark/);
  await page.keyboard.press("d");
  await expect(root).toHaveClass(/light/);
  await page.keyboard.press("Control+d");
  await expect(root).toHaveClass(/light/);
  await page.keyboard.press("/");
  const search = page.getByRole("combobox");
  await search.fill("d");
  await search.press("d");
  await expect(root).toHaveClass(/light/);
});

for (const fallback of ["reduced motion", "unsupported browser"]) {
  test(`theme switching works with ${fallback}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    if (fallback === "unsupported browser") {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.addInitScript(() => {
        Object.defineProperty(document, "startViewTransition", { value: undefined });
      });
    }
    await page.goto("/");
    await page.getByRole("button", { name: /Ganti ke tema/ }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator("html")).not.toHaveClass(/theme-transition/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
}
