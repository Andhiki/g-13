import assert from "node:assert/strict";
import { test } from "@playwright/test";

const baseURL = process.env.I18N_TEST_URL ?? "http://127.0.0.1:4173";
test.use({ locale: "id", viewport: { width: 1440, height: 1000 } });

async function session(context, language, cookieMode) {
  await context.addCookies([{ name: "g13-language", value: language, url: baseURL }]);
  if (cookieMode) {
    await context.addInitScript((mode) => {
      const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
      Object.defineProperty(Document.prototype, "cookie", {
        get() {
          if (mode === "denied") throw new DOMException("Cookie access denied", "SecurityError");
          return descriptor.get.call(this);
        },
        set() {
          if (mode === "denied") throw new DOMException("Cookie access denied", "SecurityError");
        },
        configurable: true,
      });
    }, cookieMode);
  }
}

async function hydrated(page) {
  await page.waitForFunction(
    () =>
      document.querySelector('button[aria-label="Pengaturan"], button[aria-label="Settings"]')
        ?.disabled === false,
  );
}

for (const language of ["id", "en"]) {
  test(`mixed-case routes load their own namespace in ${language}`, async ({ context, page }) => {
    const titles = {
      id: {
        "/Resources": "Bingung harus mulai dari mana?",
        "/ALUMNI": "Kenali Alumni Kami",
        "/EXAM": "Arsip Ujian",
        "/RoAdMaP": "Kurikulum mana yang kamu ikuti?",
      },
      en: {
        "/Resources": "Looking for a place to start?",
        "/ALUMNI": "Meet Our Alumni",
        "/EXAM": "Exam archive",
        "/RoAdMaP": "Which curriculum do you follow?",
      },
    };
    await session(context, language);
    for (const [pathname, title] of Object.entries(titles[language])) {
      const response = await page.goto(`${baseURL}${pathname}`);
      assert.equal(response.status(), 200);
      await page.getByRole("heading", { name: title, exact: true }).waitFor();
      assert.equal(await page.locator("html").getAttribute("lang"), language);
    }
  });
}

for (const mode of ["ignored", "denied"]) {
  test(`language selection and navigation work when cookie access is ${mode}`, async ({
    context,
    page,
  }) => {
    await session(context, "id", mode);
    await page.goto(`${baseURL}/resources`);
    await hydrated(page);
    await page.getByRole("link", { name: "Arsip Ujian", exact: true }).click();
    await page.getByRole("heading", { name: "Arsip Ujian", exact: true }).waitFor();
    await page.getByRole("button", { name: "Pengaturan", exact: true }).click();
    await page.getByRole("tab", { name: "English", exact: true }).click();
    await page.getByRole("heading", { name: "Settings", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("heading", { name: "Exam archive", exact: true }).waitFor();
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    await page.getByRole("link", { name: "Learning resources", exact: true }).click();
    await page
      .getByRole("heading", { name: "Looking for a place to start?", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("tab", { name: "Bahasa Indonesia", exact: true }).click();
    await page.getByRole("heading", { name: "Pengaturan", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await page
      .getByRole("heading", { name: "Bingung harus mulai dari mana?", exact: true })
      .waitFor();
  });
}

test("failed language downloads preserve the current page and preference", async ({
  context,
  page,
}) => {
  await session(context, "id");
  await page.goto(`${baseURL}/resources`);
  await hydrated(page);
  await page.route("**/assets/common-*.js", (route) => route.abort());
  await page.getByRole("button", { name: "Pengaturan", exact: true }).click();
  await page.getByRole("tab", { name: "English", exact: true }).click();
  await page.keyboard.press("Escape");
  await page
    .getByText("Bahasa gagal dimuat. Periksa koneksi dan muat ulang untuk mencoba lagi.", {
      exact: true,
    })
    .waitFor();
  await page
    .getByRole("heading", { name: "Bingung harus mulai dari mana?", exact: true })
    .waitFor();
  assert.equal(await page.locator("html").getAttribute("lang"), "id");
  assert.equal(
    (await context.cookies()).find((cookie) => cookie.name === "g13-language").value,
    "id",
  );
  await page.getByRole("button", { name: "Muat ulang", exact: true }).click();
  await page
    .getByRole("heading", { name: "Bingung harus mulai dari mana?", exact: true })
    .waitFor();
});

test("successful language selection persists across reloads", async ({ context, page }) => {
  await session(context, "id");
  await page.goto(`${baseURL}/resources`);
  await hydrated(page);
  await page.getByRole("button", { name: "Pengaturan", exact: true }).click();
  await page.getByRole("tab", { name: "English", exact: true }).click();
  await page.getByRole("heading", { name: "Settings", exact: true }).waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("heading", { name: "Looking for a place to start?", exact: true }).waitFor();
  assert.equal(
    (await context.cookies()).find((cookie) => cookie.name === "g13-language").value,
    "en",
  );
  await page.reload();
  await page.getByRole("heading", { name: "Looking for a place to start?", exact: true }).waitFor();
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
});
