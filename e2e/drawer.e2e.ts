import { expect, test } from "@playwright/test";

test("2026 machine learning shows both source syllabi instead of missing content", async ({
  page,
}) => {
  await page.goto("/?kurikulum=2026&mk=PACS262413");
  await page.getByRole("button", { name: "Silabus", exact: true }).click();
  await expect(page.getByText(/Dokumen kurikulum memuat 2 versi silabus/)).toBeVisible();
  await expect(page.getByText("Versi sumber — halaman cetak 199", { exact: true })).toBeVisible();
  await expect(page.getByText("Versi sumber — halaman cetak 211", { exact: true })).toBeAttached();
  await expect(page.getByText(/Pengantar machine learning dan konsep dasar/)).toBeAttached();
  const secondVersion = page.getByText(
    /Konsep Pembelajaran Mesin dan tipe-tipe Pembelajaran Mesin/,
  );
  await secondVersion.scrollIntoViewIfNeeded();
  await expect(secondVersion).toBeVisible();
  await expect(page.getByText(/Sumber:.*halaman cetak 199 \(halaman PDF 217\)/)).toBeAttached();
  await expect(page.getByText(/Sumber:.*halaman cetak 211 \(halaman PDF 229\)/)).toBeAttached();
  await expect(page.getByText(/Silabus mata kuliah ini belum tersedia/)).toHaveCount(0);
});

test("list leaves room for the open course details", async ({ page, isMobile }) => {
  await page.goto("/?kurikulum=2026");
  await page.getByRole("button", { name: "Switch View", exact: true }).click();
  await page
    .getByRole("button", { name: "Buka detail Algoritma dan Struktur Data", exact: true })
    .click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  const list = page.getByLabel("Daftar mata kuliah");
  await list.evaluate(async () => {
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => {})),
    );
  });
  if (isMobile) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const listBounds = await list.boundingBox();
    const drawerBounds = await drawer.boundingBox();
    expect(listBounds!.y + listBounds!.height).toBeLessThanOrEqual(drawerBounds!.y);
  } else {
    for (const width of [1708, 1440, 1138, 800, 650]) {
      await page.setViewportSize({ width, height: 900 });
      const drawerBounds = await drawer.boundingBox();
      const listBounds = await list.boundingBox();
      expect(listBounds!.x).toBeGreaterThanOrEqual(drawerBounds!.x + drawerBounds!.width);
      if (width === 1138) {
        expect(listBounds!.width).toBeGreaterThan(680);
        const filter = page.getByRole("button", { name: "Buka filter kurikulum" });
        expect((await filter.boundingBox())!.y).toBeLessThan(30);
        await filter.click();
        await expect(page.getByRole("tablist", { name: "Versi kurikulum" })).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(filter).toBeFocused();
      }
    }
    await page.getByRole("button", { name: "Tutup detail mata kuliah" }).click();
    await expect(drawer).toHaveCount(0);
    expect((await list.boundingBox())!.x).toBeLessThan(400);
  }
});

test("syllabus closing does not rebound before content unmounts", async ({ page }) => {
  await page.goto("/?kurikulum=2026&mk=PACS262201");
  const trigger = page.getByRole("button", { name: "Silabus", exact: true });
  await trigger.click();
  await trigger.evaluate(async (button) => {
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => {})),
    );
    let scroller = button.parentElement!;
    while (getComputedStyle(scroller).overflowY !== "auto") scroller = scroller.parentElement!;
    scroller.scrollTop =
      button.getBoundingClientRect().top - scroller.getBoundingClientRect().top + 100;
  });
  const heights = await trigger.evaluate(async (button) => {
    const heights: number[] = [];
    const heading = [...document.querySelectorAll("h3")].find(
      (el) => el.textContent === "Prasyarat",
    )!;
    (button as HTMLButtonElement).click();
    const start = performance.now();
    while (performance.now() - start < 400) {
      heights.push(heading.getBoundingClientRect().top);
      await new Promise(requestAnimationFrame);
    }
    return heights;
  });
  const rebounds = heights.slice(1).filter((height, index) => height > heights[index] + 1);
  expect(rebounds, JSON.stringify(heights)).toEqual([]);
});

test("course syllabus can be expanded and collapsed", async ({ page, isMobile }) => {
  await page.goto("/?kurikulum=2026");
  await page
    .getByRole("button", { name: "Buka detail Algoritma dan Struktur Data", exact: true })
    .click();
  const trigger = page.getByRole("button", { name: "Silabus", exact: true });
  const typography = (element: Element) => {
    const style = getComputedStyle(element);
    return [style.fontSize, style.fontWeight, style.lineHeight, style.letterSpacing, style.color];
  };
  expect(await trigger.evaluate(typography)).toEqual(
    await page.getByRole("heading", { name: "Prasyarat", exact: true }).evaluate(typography),
  );
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Disjoint Set", { exact: false })).toBeVisible();
  await expect(page.getByText("Disjoint Set", { exact: false })).toHaveCSS(
    "font-size",
    isMobile ? "12px" : "13px",
  );
  await expect(page.getByRole("list", { name: "Pokok bahasan" }).getByRole("listitem")).toHaveCount(
    14,
  );
  const referenceLinks = page.getByRole("link", { name: /\(cari di Google, tab baru\)$/ });
  await expect(referenceLinks).toHaveCount(3);
  const firstReference = referenceLinks.first();
  await expect(firstReference).toContainText("Dasgupta");
  await expect(firstReference.locator("svg")).toHaveCount(1);
  const searchUrl = new URL((await firstReference.getAttribute("href"))!);
  expect(searchUrl.origin).toBe("https://www.google.com");
  expect(searchUrl.searchParams.get("q")).toContain("Dasgupta");
  await expect(firstReference).toHaveAttribute("target", "_blank");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("2021 syllabus and unavailable 2026 syllabus use the same disclosure", async ({ page }) => {
  await page.goto("/?kurikulum=2021&mk=MII21-1001");
  await page.getByRole("button", { name: "Silabus", exact: true }).click();
  await expect(page.getByText("Eliminasi Gauss-Jordan", { exact: false })).toBeVisible();
  await page.goto("/?kurikulum=2026&mk=PAKF262105");
  const trigger = page.getByRole("button", { name: "Silabus", exact: true });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(
    page.getByText("Silabus mata kuliah ini belum tersedia dalam data kurikulum 2026."),
  ).toBeVisible();
});

test("syllabus header scrolls with its content", async ({ page }) => {
  await page.goto("/?kurikulum=2026");
  await page
    .getByRole("button", { name: "Buka detail Algoritma dan Struktur Data", exact: true })
    .click();
  await page.setViewportSize({ width: page.viewportSize()!.width, height: 600 });
  const trigger = page.getByRole("button", { name: "Silabus", exact: true });
  await trigger.click();
  const positions = await trigger.evaluate(async (button) => {
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => {})),
    );
    const header = button.parentElement!;
    let scroller = header.parentElement!;
    while (getComputedStyle(scroller).overflowY !== "auto") {
      scroller = scroller.parentElement!;
    }
    scroller.scrollTop +=
      header.getBoundingClientRect().top - scroller.getBoundingClientRect().top + 60;
    const headerTop = header.getBoundingClientRect().top;
    const previousScroll = scroller.scrollTop;
    scroller.scrollTop += 30;
    return {
      headerTop,
      nextHeaderTop: header.getBoundingClientRect().top,
      scrolled: scroller.scrollTop - previousScroll,
    };
  });
  expect(positions.scrolled).toBeGreaterThan(0);
  expect(positions.headerTop - positions.nextHeaderTop).toBeCloseTo(positions.scrolled, 0);
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

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
