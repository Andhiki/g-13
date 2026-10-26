import { expect, test } from "@playwright/test";

for (const [year, interest, title] of [
  ["2021", "Lab Rekayasa Perangkat Lunak dan Data", "Matematika Diskrit"],
  ["2026", "Analisis Data", "Algoritma dan Struktur Data"],
] as const) {
  test(`${year}: course details leave the roadmap clear and interactive`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const params = new URLSearchParams({
      kurikulum: year,
      minat: interest,
      iup: "tidak",
      magang: "tidak",
      hasil: "true",
    });
    await page.goto(`/roadmap?${params}`);
    await expect(page.locator(".react-flow__node-course").first()).toBeVisible();
    await page.getByRole("button", { name: "Semester 2", exact: true }).click();
    await page.getByRole("button", { name: `Buka detail ${title}`, exact: true }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    expect(await drawer.evaluate((el) => getComputedStyle(el.parentElement!).backdropFilter)).toBe(
      "none",
    );
    await expect(
      page.getByRole("application", { name: "Roadmap mata kuliah per semester" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Semester 3", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
  });
}
