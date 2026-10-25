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
    await expect(filterTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("combobox", { name: /Versi kurikulum/ })).toHaveCount(0);
    await filterTrigger.click();
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
    await filterTrigger.click();
    await expect(page.getByRole("combobox", { name: /Kelompok pilihan/ })).toContainText(
      "Lab Sistem Komputer dan Jaringan",
    );
  }
});

test("desktop filter toggles, keeps choices, and closes with Escape", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile);
  await page.goto("/?kurikulum=2026");
  const toggle = page.getByRole("button", { name: /filter kurikulum/ });
  await toggle.click();
  const version = page.getByRole("combobox", { name: /Versi kurikulum/ });
  await expect(version).toBeVisible();
  await expect(toggle.locator("span").nth(1)).toHaveCSS("opacity", "1");
  await expect(toggle.locator("span").nth(0)).toHaveCSS("opacity", "0");
  expect(await version.evaluate((el) => getComputedStyle(el).fontSize)).toBe("14px");
  expect(await version.evaluate((el) => getComputedStyle(el).height)).toBe("36px");
  await version.click();
  await page.getByRole("option", { name: "2021 · Revisi 2023", exact: true }).click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.locator("main").click({ position: { x: 20, y: 300 } });
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await expect(toggle.locator("span").nth(0)).toHaveCSS("opacity", "1");
  await expect(toggle.locator("span").nth(1)).toHaveCSS("opacity", "0");
  await toggle.click();
  await expect(version).toContainText("2021");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("semester switcher finishes its entrance and still filters", async ({ page, isMobile }) => {
  await page.addInitScript(() => {
    new MutationObserver((records) => {
      for (const { target } of records) {
        if (
          !(target instanceof HTMLElement) ||
          target.tagName !== "SPAN" ||
          target.textContent !== "Semester"
        )
          continue;
        const style = getComputedStyle(target);
        if (style.opacity === "1" && new DOMMatrixReadOnly(style.transform).m41 > 1) {
          document.documentElement.dataset.semesterSlides = "true";
        }
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["style"] });
  });
  await page.goto("/?kurikulum=2026");
  const switcher = page.getByRole("group", { name: "Filter semester" }).locator("div");
  await expect(switcher).toHaveCSS("opacity", "1");
  await expect(switcher).toHaveCSS("transform", "none");
  await expect(
    page.getByRole("group", { name: "Filter semester" }).getByText("Semester", { exact: true }),
  ).toHaveCSS("opacity", "1");
  const label = page
    .getByRole("group", { name: "Filter semester" })
    .getByText("Semester", { exact: true });
  await expect(label).toHaveCSS("transform", "none");
  if (!isMobile) await expect(page.locator("html")).toHaveAttribute("data-semester-slides", "true");
  const semester = page.getByRole("button", { name: "Semester 2", exact: true });
  await semester.click();
  await expect(semester).toHaveAttribute("aria-pressed", "true");
});
