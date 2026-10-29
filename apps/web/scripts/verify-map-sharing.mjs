import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";

const baseURL = process.env.INTERACTION_TEST_URL ?? "http://127.0.0.1:4173";
const roadmapPath = `/roadmap?${new URLSearchParams({ kurikulum: "2026", minat: "Analisis Data", iup: "tidak", magang: "tidak", lulus: "8", hasil: "true" })}`;
const archivePath = `/exam?${new URLSearchParams({ course: "1fFKbV60PkrCgd7PTCnxSwHusBnk_z_oD", year: "2020", file: "1bcr4x-t7ysNPH4GEUxvTjw1Y0rlQxppi" })}`;
let browser;
before(async () => {
  browser = await chromium.launch({ headless: true });
});
after(async () => {
  await browser?.close();
});

async function session(width = 1440) {
  const context = await browser.newContext({
    locale: "id",
    viewport: { width, height: 1000 },
    reducedMotion: width === 1440 ? "no-preference" : "reduce",
  });
  await context.addCookies([{ name: "g13-language", value: "id", url: baseURL }]);
  await context.route("https://drive.google.com/**", (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.setDefaultTimeout(15000);
  return { context, page, errors };
}

async function open(page, path) {
  await page.goto(`${baseURL}${path}`);
  await page.waitForFunction(
    () => document.querySelector('[aria-keyshortcuts="D"]')?.disabled === false,
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
    test(`${path === "/" ? "curriculum" : "roadmap"}, ${width}px: closing details restores a panned view; semester navigation wins`, async () => {
      const { context, page, errors } = await session(width);
      try {
        await open(page, path);
        await page.locator("[data-course-button]").first().waitFor();
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
          await page.getByRole("button", { name: "Kembali ke tampilan awal", exact: true }).click();
          await expectViewport(page, initial);
        }
        assert.deepEqual(errors, []);
      } finally {
        await context.close();
      }
    });
  }
}

for (const feature of ["roadmap", "archive"]) {
  test(`${feature}: sharing handles success, failure, overlapping copies, and leaving during a copy`, async () => {
    const { context, page, errors } = await session();
    try {
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
    } finally {
      await context.close();
    }
  });
}
