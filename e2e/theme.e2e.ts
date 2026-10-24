import { expect, test } from "@playwright/test";

test("theme reveal switches both ways and keeps the system preference", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const root = page.locator("html");
  const trigger = page.getByRole("button", { name: /Pilih tema tampilan/ });
  for (const label of ["Gelap", "Terang", "Gelap", "Sistem"]) {
    await trigger.click();
    await page.getByRole("menuitemradio", { name: label, exact: true }).click();
    await expect(root).toHaveClass(/theme-transition/);
    await expect(page.getByRole("menu", { name: "Pilih tema tampilan" })).toHaveCount(0);
    await expect(root).toHaveClass(label === "Gelap" ? /dark/ : /light/);
    await expect(root).not.toHaveClass(/theme-transition/);
    await expect(trigger).toBeFocused();
  }
  await page.reload();
  await expect(trigger).toHaveAttribute("title", "Tema tampilan: Sistem");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(root).toHaveClass(/dark/);
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
    await page.getByRole("button", { name: /Pilih tema tampilan/ }).click();
    await page.getByRole("menuitemradio", { name: "Gelap", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator("html")).not.toHaveClass(/theme-transition/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
}
