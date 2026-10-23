import { expect, test } from "@playwright/test";

test("curriculum and interest filters persist between the drawer, list, and desktop panel", async ({
  page,
  isMobile,
}) => {
  await page.goto("/?kurikulum=2026");
  await expect(page.locator(".react-flow__node-course").first()).toBeVisible();
  const filterTrigger = page.getByRole("button", { name: "Buka filter kurikulum" });
  if (isMobile) {
    await expect(page.getByRole("combobox", { name: /Versi kurikulum/ })).toHaveCount(0);
    await page.evaluate(() => {
      document.addEventListener("animationstart", (event) => {
        if (
          !(event.target instanceof HTMLElement) ||
          event.target.getAttribute("role") !== "dialog"
        )
          return;
        const transform = new DOMMatrixReadOnly(getComputedStyle(event.target).transform);
        event.target.dataset.animationX = String(transform.m41);
        event.target.dataset.animationY = String(transform.m42);
      });
    });
    await filterTrigger.click();
    const drawer = page.getByRole("dialog", { name: "Filter kurikulum" });
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute("data-animation-x", "0");
    expect(Number(await drawer.getAttribute("data-animation-y"))).toBeGreaterThan(0);
    await expect
      .poll(async () => {
        const bounds = await drawer.boundingBox();
        return bounds ? Math.round(bounds.y + bounds.height) : 0;
      })
      .toBe(page.viewportSize()!.height);
    const bounds = await drawer.boundingBox();
    expect(bounds!.height).toBeLessThan(page.viewportSize()!.height / 2);
    expect(bounds!.width).toBe(page.viewportSize()!.width);
  } else {
    await expect(filterTrigger).toHaveCount(0);
  }
  await page.getByRole("combobox", { name: /Versi kurikulum/ }).click();
  await page.getByRole("option", { name: "2021 · Revisi 2023", exact: true }).click();
  await expect(page).toHaveURL(/2021/);
  await page.getByRole("combobox", { name: /Kelompok pilihan/ }).click();
  await page.getByRole("option", { name: /^Lab Sistem Komputer dan Jaringan/ }).click();
  if (isMobile) {
    await page.getByRole("button", { name: "Tampilkan mata kuliah", exact: true }).click();
    await expect(filterTrigger).toBeFocused();
  }
  await page.getByRole("button", { name: "Switch View", exact: true }).click();
  await expect(page.getByRole("table").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Buka detail Komputasi Awan", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Buka detail Pembelajaran Mesin", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Buka detail Logika Fuzzy", exact: true }),
  ).toHaveCount(0);
  if (isMobile) {
    await filterTrigger.click();
    await expect(page.getByRole("combobox", { name: /Versi kurikulum/ })).toContainText("2021");
    await expect(page.getByRole("combobox", { name: /Kelompok pilihan/ })).toContainText(
      "Lab Sistem Komputer dan Jaringan",
    );
    await page.keyboard.press("Escape");
    await expect(filterTrigger).toBeFocused();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole("combobox", { name: /Kelompok pilihan/ })).toContainText(
      "Lab Sistem Komputer dan Jaringan",
    );
  }
});
