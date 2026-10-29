import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";

const baseURL = process.env.I18N_TEST_URL ?? "http://127.0.0.1:4173";
let browser;
before(async () => {
  browser = await chromium.launch({ headless: true });
});
after(async () => {
  await browser?.close();
});

async function session(language, cookieMode) {
  const context = await browser.newContext({
    locale: language,
    viewport: { width: 1440, height: 1000 },
  });
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
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  return { context, page };
}

async function hydrated(page) {
  await page.waitForFunction(
    () => document.querySelector('[aria-keyshortcuts="D"]')?.disabled === false,
  );
}

test("mixed-case routes load their own namespace in both languages", async () => {
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
  for (const language of ["id", "en"]) {
    const { context, page } = await session(language);
    try {
      for (const [pathname, title] of Object.entries(titles[language])) {
        const response = await page.goto(`${baseURL}${pathname}`);
        assert.equal(response.status(), 200);
        await page.getByRole("heading", { name: title, exact: true }).waitFor();
        assert.equal(await page.locator("html").getAttribute("lang"), language);
      }
    } finally {
      await context.close();
    }
  }
});

for (const mode of ["ignored", "denied"]) {
  test(`language selection and navigation work when cookie access is ${mode}`, async () => {
    const { context, page } = await session("id", mode);
    try {
      await page.goto(`${baseURL}/resources`);
      await hydrated(page);
      await page.getByRole("link", { name: "Arsip Ujian", exact: true }).click();
      await page.getByRole("heading", { name: "Arsip Ujian", exact: true }).waitFor();
      await page.getByRole("button", { name: "Beralih ke bahasa Inggris" }).click();
      await page.getByRole("heading", { name: "Exam archive", exact: true }).waitFor();
      assert.equal(await page.locator("html").getAttribute("lang"), "en");
      await page.getByRole("link", { name: "Learning resources", exact: true }).click();
      await page
        .getByRole("heading", { name: "Looking for a place to start?", exact: true })
        .waitFor();
      await page.getByRole("button", { name: "Switch to Indonesian" }).click();
      await page
        .getByRole("heading", { name: "Bingung harus mulai dari mana?", exact: true })
        .waitFor();
    } finally {
      await context.close();
    }
  });
}

test("failed language downloads preserve the current page and preference", async () => {
  const { context, page } = await session("id");
  try {
    await page.goto(`${baseURL}/resources`);
    await hydrated(page);
    await page.route("**/assets/common-*.js", (route) => route.abort());
    await page.getByRole("button", { name: "Beralih ke bahasa Inggris" }).click();
    await page
      .getByText("Bahasa gagal dimuat. Periksa koneksi dan muat ulang untuk mencoba lagi.", {
        exact: true,
      })
      .waitFor();
    assert.ok(
      await page
        .getByRole("heading", { name: "Bingung harus mulai dari mana?", exact: true })
        .isVisible(),
    );
    assert.equal(await page.locator("html").getAttribute("lang"), "id");
    assert.equal(
      (await context.cookies()).find((cookie) => cookie.name === "g13-language").value,
      "id",
    );
    await page.getByRole("button", { name: "Muat ulang", exact: true }).click();
    await page
      .getByRole("heading", { name: "Bingung harus mulai dari mana?", exact: true })
      .waitFor();
  } finally {
    await context.close();
  }
});

test("successful language selection persists across reloads", async () => {
  const { context, page } = await session("id");
  try {
    await page.goto(`${baseURL}/resources`);
    await hydrated(page);
    await page.getByRole("button", { name: "Beralih ke bahasa Inggris" }).click();
    await page
      .getByRole("heading", { name: "Looking for a place to start?", exact: true })
      .waitFor();
    assert.equal(
      (await context.cookies()).find((cookie) => cookie.name === "g13-language").value,
      "en",
    );
    await page.reload();
    await page
      .getByRole("heading", { name: "Looking for a place to start?", exact: true })
      .waitFor();
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
  } finally {
    await context.close();
  }
});
