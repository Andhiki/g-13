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
  await page.keyboard.press("Shift+d");
  await page.evaluate(() =>
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d", repeat: true })),
  );
  await expect(theme).toHaveAttribute("aria-label", before!);
  await page.evaluate(() =>
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "/", shiftKey: true })),
  );
  const search = page.getByRole("combobox", { name: "Cari mata kuliah" });
  await expect(search).toBeVisible();
  await search.pressSequentially("d");
  await expect(theme).toHaveAttribute("aria-label", before!);
});

test("failed details download keeps the map usable and can be reloaded", async ({ page }) => {
  await page.route("**/CourseDetailsPanel-*.js", (route) => route.abort());
  await page.goto("/?kurikulum=2026");
  await page
    .getByRole("button", { name: "Buka detail Algoritma dan Struktur Data", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Konten gagal dimuat");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: "Semester 1", exact: true })).toBeEnabled();
  await page.unroute("**/CourseDetailsPanel-*.js");
  await page.getByRole("button", { name: "Muat ulang", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("failed roadmap download offers recovery without losing answers", async ({ page }) => {
  await page.route("**/RoadmapResult-*.js", (route) => route.abort());
  await page.goto(
    "/roadmap?kurikulum=2026&minat=Analisis%20Data&iup=tidak&magang=tidak&hasil=true",
  );
  await expect(page.getByRole("alert")).toContainText("Konten gagal dimuat");
  await expect(page.getByRole("alert")).toBeVisible();
  await page.unroute("**/RoadmapResult-*.js");
  await page.getByRole("button", { name: "Muat ulang", exact: true }).click();
  await expect(page.locator(".react-flow__node-course").first()).toBeVisible();
  await expect(page).toHaveURL(/minat=Analisis/);
});

test("clearing a course selection hides its pending details", async ({ page }) => {
  const { promise: pending, resolve: release } = Promise.withResolvers<void>();
  await page.route("**/CourseDetailsPanel-*.js", async (route) => {
    await pending;
    await route.continue();
  });
  try {
    await page.goto("/?kurikulum=2026");
    await page
      .getByRole("button", { name: "Buka detail Algoritma dan Struktur Data", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Memuat detail mata kuliah");
    await page.getByRole("button", { name: "Semester 1", exact: true }).click();
    await expect(page).not.toHaveURL(/mk=/);
    await expect(page.getByRole("status")).toHaveCount(0);
    release();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  } finally {
    release();
  }
});

test("shifted arrow does not navigate the roadmap quiz", async ({ page }) => {
  await page.goto("/roadmap?kurikulum=2026&langkah=iup");
  await expect(page.getByRole("heading", { name: "Kamu mahasiswa IUP?" })).toBeVisible();
  await expect(page.locator('button[aria-keyshortcuts="D"]')).toBeEnabled();
  await page.keyboard.press("Shift+ArrowLeft");
  await expect(page).toHaveURL(/langkah=iup/);
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/langkah=kurikulum/);
});
