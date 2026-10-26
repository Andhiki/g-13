import { expect, test } from "@playwright/test";

test("desktop filter moves continuously between views and keeps its open state", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile);
  await page.goto("/?kurikulum=2026");
  const toggle = page.getByRole("button", { name: "Buka filter kurikulum" });
  await toggle.click();
  for (const destination of [14, 66]) {
    const positions = await page
      .getByRole("button", { name: "Switch View", exact: true })
      .evaluate(async (button) => {
        const filter = document.querySelector('[aria-controls="desktop-filters"]')!;
        const positions = [filter.getBoundingClientRect().top];
        (button as HTMLButtonElement).click();
        const start = performance.now();
        while (performance.now() - start < 600) {
          await new Promise(requestAnimationFrame);
          positions.push(filter.getBoundingClientRect().top);
        }
        return positions;
      });
    expect(positions.some((top) => top > 18 && top < 62)).toBe(true);
    expect(positions.at(-1)).toBeCloseTo(destination, 0);
    await expect(page.getByRole("button", { name: "Tutup filter kurikulum" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  }
});

test("curriculum and interest filters persist between the drawer, list, and desktop panel", async ({
  page,
  isMobile,
}) => {
  await page.goto("/?kurikulum=2026");
  await expect(page.locator(".react-flow__node-course").first()).toBeVisible();
  const filterTrigger = page.getByRole("button", { name: "Buka filter kurikulum" });
  if (isMobile) {
    await expect(page.getByRole("tablist", { name: "Versi kurikulum" })).toHaveCount(0);
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
    await expect(page.getByRole("tablist", { name: "Versi kurikulum" })).toHaveCount(0);
    await filterTrigger.click();
  }
  await page.getByRole("tab", { name: "2021 Revisi 2023", exact: true }).click();
  await expect(page).toHaveURL(/2021/);
  await page.getByRole("combobox", { name: /Kelompok pilihan/ }).click();
  await expect(page.getByRole("option").first()).toHaveCSS("font-size", "14px");
  await expect(page.getByRole("option").first()).toHaveCSS("line-height", "20px");
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
    await expect(page.getByRole("tablist", { name: "Versi kurikulum" })).toContainText("2021");
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
  const version = page.getByRole("tablist", { name: "Versi kurikulum" });
  await expect(version).toBeVisible();
  await expect(toggle.locator("span").nth(1)).toHaveCSS("opacity", "1");
  await expect(toggle.locator("span").nth(0)).toHaveCSS("opacity", "0");
  expect(
    await page
      .getByRole("tab", { name: "2026", exact: true })
      .evaluate((el) => getComputedStyle(el).fontSize),
  ).toBe("14px");
  expect(await version.evaluate((el) => getComputedStyle(el).height)).toBe("36px");
  await page.getByRole("tab", { name: "2021 Revisi 2023", exact: true }).click();
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

test("semester switcher finishes its entrance and navigates without filtering", async ({
  page,
  isMobile,
}) => {
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
  const switcher = page.getByRole("group", { name: "Navigasi semester" }).locator("div").first();
  await expect(switcher).toHaveCSS("opacity", "1");
  await expect(switcher).toHaveCSS("transform", "none");
  await expect(
    page.getByRole("group", { name: "Navigasi semester" }).getByText("Semester", { exact: true }),
  ).toHaveCSS("opacity", "1");
  const label = page
    .getByRole("group", { name: "Navigasi semester" })
    .getByText("Semester", { exact: true });
  await expect(label).toHaveCSS("transform", "none");
  if (!isMobile) await expect(page.locator("html")).toHaveAttribute("data-semester-slides", "true");
  const semester = page.getByRole("button", { name: "Semester 2", exact: true });
  const count = await page.locator(".react-flow__node-course").count();
  await semester.click();
  await expect(semester).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".react-flow__node-course")).toHaveCount(count);
});

test("semester band follows map panning and zooming", async ({ page }) => {
  await page.goto("/?kurikulum=2026");
  const buttons = page.getByRole("group", { name: "Navigasi semester" }).getByRole("button");
  await expect(page.locator(".react-flow__node-course").first()).toBeVisible();
  const count = await page.locator(".react-flow__node-course").count();
  await page.getByRole("button", { name: "Semester 8", exact: true }).click();
  await expect(buttons.nth(7)).toHaveAttribute("aria-pressed", "true");
  await expect(buttons.nth(0)).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".react-flow__node-course")).toHaveCount(count);
  await expect
    .poll(async () => {
      const bounds = await page.locator('[data-id="lane-semester-8"]').boundingBox();
      return Math.round(bounds!.x + bounds!.width / 2);
    })
    .toBe(page.viewportSize()!.width / 2);
  await page.mouse.move(20, 180);
  await page.mouse.down();
  await page.mouse.move(page.viewportSize()!.width - 20, 180, { steps: 12 });
  await page.mouse.up();
  await expect(buttons.nth(7)).toHaveAttribute("aria-pressed", "false");
  await page.mouse.move(200, 350);
  await page.mouse.wheel(0, 2400);
  await expect(
    page.locator('[aria-label="Navigasi semester"] button[aria-pressed="true"]'),
  ).toHaveCount(8);
  await expect(page.locator("[data-semester-band]")).toHaveCount(1);
});

test("list semester navigation keeps courses and follows manual scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?kurikulum=2026");
  await page.getByRole("button", { name: "Switch View", exact: true }).click();
  const tables = await page.getByRole("table").count();
  await page.getByRole("button", { name: "Semester 3", exact: true }).click();
  await expect(page.getByRole("button", { name: "Semester 3", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("table")).toHaveCount(tables);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.round(document.getElementById("semester-3")!.getBoundingClientRect().top),
      ),
    )
    .toBeLessThan(130);
  await page.mouse.move(100, 300);
  await page.mouse.wheel(0, -20000);
  await expect(page.getByRole("button", { name: "Semester 1", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("semester navigation respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?kurikulum=2026");
  await page.getByRole("button", { name: "Semester 8", exact: true }).click();
  await expect(page.getByRole("button", { name: "Semester 8", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Switch View", exact: true }).click();
  await page.getByRole("button", { name: "Semester 1", exact: true }).click();
  await expect(page.getByRole("button", { name: "Semester 1", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
