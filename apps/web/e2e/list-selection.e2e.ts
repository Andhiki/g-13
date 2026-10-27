import { expect, test } from "@playwright/test";

test("every part of a course row opens its details on the first click", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?kurikulum=2026");
  await page.getByRole("button", { name: "Switch View", exact: true }).click();
  const row = page.getByRole("row").filter({
    has: page.getByRole("button", {
      name: "Buka detail Algoritma dan Struktur Data",
      exact: true,
    }),
  });
  const targets = isMobile ? [0, 1] : [0, 1, 2, 3];
  for (const column of targets) {
    await row
      .getByRole("cell")
      .nth(column)
      .click({ position: { x: 8, y: 5 } });
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page
        .getByRole("dialog")
        .getByRole("heading", { name: "Algoritma dan Struktur Data", exact: true }),
    ).toBeVisible();
    if (isMobile) {
      const handle = page.getByRole("slider", { name: "Tinggi detail mata kuliah" });
      await handle.focus();
      await expect(handle).toHaveCSS("outline-style", "none");
      await page.keyboard.press("End");
      await expect(handle).toHaveAttribute("aria-valuenow", "75");
    }
    await page.getByRole("button", { name: "Tutup detail mata kuliah" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await row.getByRole("button").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
});
