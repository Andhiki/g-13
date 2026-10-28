import { expect, test } from "@playwright/test";

test("syllabi load only on demand and a failed download leaves course details usable", async ({
  page,
}) => {
  const syllabi: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/syllabi-")) syllabi.push(request.url());
  });
  await page.goto("/?kurikulum=2026");
  await page
    .getByRole("button", { name: "Buka detail Algoritma dan Struktur Data", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(syllabi).toHaveLength(0);
  await page.route("**/syllabi-*.js", (route) => route.abort());
  await dialog.getByRole("button", { name: "Silabus", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Silabus gagal dimuat");
  await expect(dialog.getByRole("button", { name: "Tutup detail mata kuliah" })).toBeEnabled();
  await page.unroute("**/syllabi-*.js");
  await dialog.getByRole("button", { name: "Muat ulang" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Silabus", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Disjoint Set and Union Find");
});

test("shortcuts ignore modified keys, repeated presses, and text input", async ({ page }) => {
  await page.goto("/?kurikulum=2026");
  const theme = page.locator('button[aria-keyshortcuts="D"]');
  await expect(theme).toBeEnabled();
  const before = await theme.getAttribute("aria-label");
  await page.keyboard.press("Control+d");
  await page.evaluate(() =>
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d", repeat: true })),
  );
  await expect(theme).toHaveAttribute("aria-label", before!);
  await page.keyboard.press("/");
  const search = page.getByRole("combobox", { name: "Cari mata kuliah" });
  await search.pressSequentially("d");
  await expect(theme).toHaveAttribute("aria-label", before!);
});
