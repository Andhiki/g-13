import { expect, test } from "@playwright/test";

type DrawerAnimation = {
  state: string | undefined;
  name: string;
  duration: number;
  translateX: number;
  translateY: number;
};

declare global {
  interface Window {
    drawerAnimations: DrawerAnimation[];
  }
}

for (const view of ["map", "list"] as const) {
  test(`${view}: course drawer animates when opening and closing`, async ({ page }) => {
    await page.addInitScript(() => {
      window.drawerAnimations = [];
      document.addEventListener("animationstart", (event) => {
        if (
          !(event.target instanceof HTMLElement) ||
          event.target.getAttribute("role") !== "dialog"
        )
          return;
        const style = getComputedStyle(event.target);
        const transform = new DOMMatrixReadOnly(style.transform);
        window.drawerAnimations.push({
          state: event.target.dataset.state,
          name: event.animationName,
          duration: Number.parseFloat(style.animationDuration),
          translateX: transform.m41,
          translateY: transform.m42,
        });
      });
    });
    await page.goto("/?kurikulum=2026");
    if (view === "list")
      await page.getByRole("button", { name: "Switch View", exact: true }).click();
    await page
      .getByRole("button", { name: "Buka detail Algoritma dan Struktur Data", exact: true })
      .click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.drawerAnimations.some((event) => event.state === "open" && event.duration >= 0.15),
        ),
      )
      .toBe(true);
    const opening = await page.evaluate(() =>
      window.drawerAnimations.find((event) => event.state === "open"),
    );
    const bottomDrawer = (page.viewportSize()?.width ?? 1440) < 650;
    if (bottomDrawer) {
      expect(opening?.translateX).toBeCloseTo(0);
      expect(opening?.translateY).toBeGreaterThan(0);
    } else {
      expect(opening?.translateX).toBeLessThan(0);
      expect(opening?.translateY).toBeCloseTo(0);
    }
    await page.getByRole("button", { name: "Tutup detail mata kuliah" }).click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.drawerAnimations.some(
            (event) => event.state === "closed" && event.duration >= 0.15,
          ),
        ),
      )
      .toBe(true);
    const closing = await page.evaluate(() =>
      window.drawerAnimations.find((event) => event.state === "closed"),
    );
    if (bottomDrawer) expect(closing?.translateX).toBeCloseTo(0);
    else expect(closing?.translateY).toBeCloseTo(0);
    await expect(drawer).toHaveCount(0);
    await expect(page).not.toHaveURL(/mk=/);
  });
}

for (const view of ["map", "list"] as const) {
  test(`${view}: course drawer respects reduced motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?kurikulum=2026");
    if (view === "list")
      await page.getByRole("button", { name: "Switch View", exact: true }).click();
    await page
      .getByRole("button", { name: "Buka detail Algoritma dan Struktur Data", exact: true })
      .click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    expect(
      await drawer.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).animationDuration),
      ),
    ).toBeLessThan(0.001);
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await expect(page).not.toHaveURL(/mk=/);
  });
}
