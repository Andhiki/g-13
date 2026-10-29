import assert from "node:assert/strict";
import { test, expect } from "@playwright/test";

const baseURL = process.env.INTERACTION_TEST_URL ?? "http://127.0.0.1:4173";
const roadmapPath = `/roadmap?${new URLSearchParams({ kurikulum: "2026", minat: "Analisis Data", iup: "tidak", magang: "tidak", lulus: "8", hasil: "true" })}`;
const archivePath = `/exam?${new URLSearchParams({ course: "1fFKbV60PkrCgd7PTCnxSwHusBnk_z_oD", year: "2020", file: "1bcr4x-t7ysNPH4GEUxvTjw1Y0rlQxppi" })}`;
test.use({ locale: "id", viewport: { width: 1440, height: 1000 } });
test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "g13-language", value: "id", url: baseURL }]);
  await context.route("https://drive.google.com/**", (route) => route.abort());
});

async function open(page, path) {
  await page.goto(`${baseURL}${path}`);
  await page.waitForFunction(
    () =>
      document.querySelector('button[aria-label="Pengaturan"], button[aria-label="Settings"]')
        ?.disabled === false,
  );
}

async function viewport(page) {
  return page.locator(".react-flow__viewport").evaluate((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return { x: matrix.e, y: matrix.f, zoom: matrix.a };
  });
}

async function settled(page) {
  await page.waitForFunction(() => {
    const transform = document.querySelector(".react-flow__viewport")?.getAttribute("style");
    if (window.lastGraphTransform !== transform) {
      window.lastGraphTransform = transform;
      window.lastGraphChange = performance.now();
    }
    return transform && performance.now() - window.lastGraphChange > 180;
  });
}

async function expectViewport(page, expected) {
  await page.waitForFunction((expected) => {
    const element = document.querySelector(".react-flow__viewport");
    const actual = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return (
      Math.abs(actual.e - expected.x) < 1 &&
      Math.abs(actual.f - expected.y) < 1 &&
      Math.abs(actual.a - expected.zoom) < 0.001
    );
  }, expected);
  await settled(page);
  const actual = await viewport(page);
  assert.ok(
    Math.abs(actual.x - expected.x) < 1 &&
      Math.abs(actual.y - expected.y) < 1 &&
      Math.abs(actual.zoom - expected.zoom) < 0.001,
  );
}

async function chooseVisibleCourse(page, connected = false) {
  const id = await page.locator("[data-course-button]").evaluateAll((buttons, connected) => {
    for (const button of buttons) {
      if (connected && !button.closest("[data-course]").querySelector(".react-flow__handle"))
        continue;
      const box = button.getBoundingClientRect();
      const x = box.x + box.width / 2,
        y = box.y + box.height / 2;
      if (x < 0 || x > innerWidth || y < 180 || y > innerHeight - 120) continue;
      if (button.contains(document.elementFromPoint(x, y)))
        return button.closest("[data-course]").dataset.course;
    }
    throw new Error("No visible course to select");
  }, connected);
  await page.locator(`[data-course="${id}"] [data-course-button]`).click();
  await page.getByRole("button", { name: "Tutup detail mata kuliah", exact: true }).waitFor();
  await settled(page);
}

for (const width of [1440, 390]) {
  for (const path of ["/", roadmapPath]) {
    test(`${path === "/" ? "curriculum" : "roadmap"}, ${width}px: closing details restores a panned view; semester navigation wins`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: width === 1440 ? "no-preference" : "reduce" });
      const errors = [];
      const startedWorkers = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("worker", (worker) => startedWorkers.push(worker));
      await open(page, path);
      await page.locator("[data-course-button]").first().waitFor();
      await expect(page.locator('[data-routed="true"]:visible').first()).toBeVisible();
      expect(startedWorkers.length).toBeGreaterThan(0);
      await settled(page);
      const initial = await viewport(page);
      await page.mouse.move(width - 70, 550);
      await page.mouse.down();
      await page.mouse.move(width - 125, 490, { steps: 8 });
      await page.mouse.up();
      await settled(page);
      const panned = await viewport(page);
      assert.notDeepEqual(panned, initial);
      await chooseVisibleCourse(page, true);
      const related = page
        .getByRole("dialog")
        .getByRole("button", { name: /^Buka detail / })
        .first();
      await related.click();
      await settled(page);
      await page.getByRole("button", { name: "Tutup detail mata kuliah", exact: true }).click();
      await expectViewport(page, panned);
      await chooseVisibleCourse(page);
      await page.getByRole("button", { name: "Semester 3", exact: true }).click();
      await page
        .getByRole("button", { name: "Tutup detail mata kuliah", exact: true })
        .waitFor({ state: "hidden" });
      await settled(page);
      const semesterView = await viewport(page);
      assert.notDeepEqual(semesterView, panned);
      await chooseVisibleCourse(page);
      await page.getByRole("button", { name: "Tutup detail mata kuliah", exact: true }).click();
      await expectViewport(page, semesterView);
      if (path === "/") {
        await chooseVisibleCourse(page);
        await expect(page.getByRole("group", { name: "Kontrol zoom", exact: true })).toHaveCount(0);
        await page.getByRole("button", { name: "Tutup detail mata kuliah", exact: true }).click();
        await page.getByRole("button", { name: "Kembali ke tampilan awal", exact: true }).click();
        await expectViewport(page, initial);
      }
      assert.deepEqual(errors, []);
    });
  }
}

for (const feature of ["roadmap", "archive"]) {
  test(`${feature}: sharing handles success, failure, overlapping copies, and leaving during a copy`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.copies = [];
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: (url) =>
            new Promise((resolve, reject) => window.copies.push({ url, resolve, reject })),
        },
        configurable: true,
      });
    });
    await open(page, feature === "roadmap" ? roadmapPath : archivePath);
    const button = () =>
      feature === "roadmap"
        ? page.getByRole("button", { name: /^(Bagikan|Tautan disalin)$/ })
        : page.getByRole("button", { name: /^(Salin tautan|Tautan berhasil disalin)$/ });
    await button().waitFor();
    const url = page.url();
    await button().click();
    await page.waitForFunction(() => window.copies.length === 1);
    assert.equal(await page.evaluate(() => window.copies[0].url), url);
    await page.evaluate(() => window.copies[0].resolve());
    await page
      .getByRole("button", {
        name: feature === "roadmap" ? "Tautan disalin" : "Tautan berhasil disalin",
        exact: true,
      })
      .waitFor();
    if (feature === "roadmap")
      await page.getByRole("button", { name: "Bagikan", exact: true }).waitFor();
    await button().click();
    await page.waitForFunction(() => window.copies.length === 2);
    await page.evaluate(() => window.copies[1].reject(new Error("Clipboard unavailable")));
    const input = page.getByRole("textbox", {
      name: feature === "roadmap" ? "Tautan roadmap" : "Tautan berkas",
      exact: true,
    });
    await input.waitFor();
    assert.equal(await input.inputValue(), url);
    if (feature === "roadmap") await page.keyboard.press("Escape");
    await button().click();
    await button().click();
    await page.waitForFunction(() => window.copies.length === 4);
    await page.evaluate(() => window.copies[3].resolve());
    await page
      .getByRole("button", {
        name: feature === "roadmap" ? "Tautan disalin" : "Tautan berhasil disalin",
        exact: true,
      })
      .waitFor();
    await page.evaluate(() => window.copies[2].reject(new Error("Earlier attempt failed")));
    assert.equal(await input.isVisible(), false);
    await button().click();
    await page.waitForFunction(() => window.copies.length === 5);
    if (feature === "roadmap") {
      await page.getByRole("button", { name: "Buka filter roadmap", exact: true }).click();
      await page.getByRole("tab", { name: "7 semester", exact: true }).click();
      await page.waitForURL(/lulus=7/);
    } else {
      await page.getByRole("button", { name: "Tutup dialog", exact: true }).click();
      await button().waitFor({ state: "hidden" });
    }
    await page.evaluate(() => window.copies[4].reject(new Error("Copy failed after navigation")));
    assert.equal(await input.isVisible(), false);
    if (feature === "roadmap") {
      await page.getByRole("tab", { name: "7 semester", exact: true, selected: true }).waitFor();
      assert.equal(
        await page.getByRole("button", { name: "Tautan disalin", exact: true }).count(),
        0,
      );
      assert.equal(await input.isVisible(), false);
    }
    assert.deepEqual(errors, []);
  });
}

test("map controls stay compact and shortcuts collapse like filters", async ({ page }) => {
  await open(page, "/");
  await settled(page);
  const zoom = page.getByRole("group", { name: "Kontrol zoom", exact: true });
  await expect(zoom).toBeVisible();
  expect((await zoom.boundingBox()).width).toBeLessThan(160);
  const keyboard = page.locator('[aria-controls="map-keyboard-shortcuts"]');
  await expect(keyboard).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#map-keyboard-shortcuts")).toHaveAttribute("inert", "");
  await keyboard.click();
  await expect(keyboard).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Ke semester", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(keyboard).toHaveAttribute("aria-expanded", "false");
  await expect(keyboard).toBeFocused();
  const view = page.getByRole("button", { name: "Tampilkan daftar", exact: true });
  const filter = page.locator('[aria-controls="desktop-filters"]');
  expect(await view.evaluate((element) => getComputedStyle(element).borderRadius)).toBe(
    await filter.evaluate((element) => getComputedStyle(element).borderRadius),
  );
  await chooseVisibleCourse(page, true);
  await expect(zoom).toHaveCount(0);
  await page.getByRole("button", { name: "Tutup detail mata kuliah", exact: true }).click();
  await expect(zoom).toBeVisible();
  await expect(page.locator('[data-routed="true"]:visible').first()).toBeVisible();
});

for (const width of [1440, 390]) {
  test(`view switches preserve the graph and keep filters below search, ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(() => {
      window.graphRoutingJobs = 0;
      const postMessage = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function (...args) {
        window.graphRoutingJobs++;
        return postMessage.apply(this, args);
      };
    });
    await open(page, "/");
    await expect(page.locator('[data-routed="true"]:visible').first()).toBeVisible();
    await settled(page);
    const filter = page.locator(
      width < 1100 ? '[aria-keyshortcuts="F"]' : '[aria-controls="desktop-filters"]',
    );
    const originalFilter = await filter.boundingBox();
    const graph = await page.locator(".react-flow").elementHandle();
    const originalViewport = await viewport(page);
    const originalBounds = await graph.boundingBox();
    const node = await page.locator(".react-flow__node").first().elementHandle();
    const originalNodeStyle = await node.getAttribute("style");
    const jobs = await page.evaluate(() => window.graphRoutingJobs);
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.getByRole("button", { name: "Tampilkan daftar", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Mata kuliah", exact: true })).toBeVisible();
      expect(await filter.boundingBox()).toEqual(originalFilter);
      expect(await graph.boundingBox()).toEqual(originalBounds);
      expect(await node.getAttribute("style")).toBe(originalNodeStyle);
      expect(await graph.evaluate((element) => element.isConnected)).toBe(true);
      await expect(page.locator("[data-map-stage]")).toHaveAttribute("inert", "");
      expect(
        await page
          .locator(".react-flow__node")
          .evaluateAll((nodes) =>
            nodes.some((node) =>
              node.checkVisibility({ visibilityProperty: true, opacityProperty: true }),
            ),
          ),
      ).toBe(false);
      await page.getByRole("button", { name: "Tampilkan peta", exact: true }).click();
      await expect(page.locator("[data-map-stage]")).not.toHaveAttribute("inert", "");
      expect(await filter.boundingBox()).toEqual(originalFilter);
      expect(
        await graph.evaluate((element) => element === document.querySelector(".react-flow")),
      ).toBe(true);
      expect(await node.evaluate((element) => element.isConnected)).toBe(true);
      expect(await node.getAttribute("style")).toBe(originalNodeStyle);
      await expectViewport(page, originalViewport);
    }
    expect(await page.evaluate(() => window.graphRoutingJobs)).toBe(jobs);
  });
}
