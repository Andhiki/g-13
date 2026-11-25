import { test } from "@e2e-dev/web";
import { expect } from "e2e";
import { notFound, publicRoutes } from "../routes.ts";

for (const route of publicRoutes) {
  test(`Public navigation and refresh for ${route.path}`, async ({ app, browser, screen }) => {
    const primary = screen
      .getByRole(route.path === "/" ? "button" : "heading", { name: route.primary })
      .first();
    if ("navigation" in route) {
      await app.open("/");
      await screen.getByRole("link", { name: route.navigation }).first().click();
      await expect(browser).toHaveURL(new RegExp(`${route.path}/?(?:[?#]|$)`));
      await expect(primary).toBeVisible();
      await browser.back();
      await expect(screen.getByRole("button", { name: publicRoutes[0].primary })).toBeVisible();
    }
    await app.open(route.path);
    await browser.reload();
    await expect(primary).toBeVisible();
  });
}

test("Unknown app URL leads back to the curriculum and the theme shortcut works", async ({
  app,
  browser,
  screen,
}) => {
  await app.open("/unknown-e2e-route");
  await expect(screen.getByRole("heading", { name: notFound })).toBeVisible();
  await screen.getByRole("link", { name: /^(kembali|back)$/i }).click();
  const curriculum = screen.getByRole("button", { name: publicRoutes[0].primary });
  await expect(curriculum).toBeVisible();
  const initial = await browser.evaluate(() => document.documentElement.classList.contains("dark"));
  await browser.keyboard.press("d");
  await expect
    .poll(() => browser.evaluate(() => document.documentElement.classList.contains("dark")))
    .toBe(!initial);
  await expect(curriculum).toBeVisible();
});

test("FAQ topic and case-insensitive answer search recover from an empty query result", async ({
  app,
  browser,
  screen,
}) => {
  await app.open("/faq");
  const search = screen.getByRole("searchbox");
  await expect
    .poll(async () => {
      if (await browser.evaluate(() => document.activeElement?.getAttribute("type") === "search")) {
        return true;
      }
      await browser.keyboard.press("/");
      return browser.evaluate(() => document.activeElement?.getAttribute("type") === "search");
    })
    .toBe(true);
  await expect(search).toBeFocused();
  await screen
    .getByRole("group", { name: /filter topik faq|faq topic filters/i })
    .getByRole("button", { name: /ketentuan peralihan|transition rules/i })
    .click();
  await search.fill("2025");
  const question = screen.getByRole("button", {
    name: /2026 berlaku untuk angkatan|who does kurikulum 2026 apply to/i,
  });
  await question.click();
  await expect(
    screen.getByText(/tidak wajib bagi angkatan 2025|not mandatory for the 2025 cohort/i),
  ).toBeVisible();
  await search.fill("NO_MATCH_E2E");
  await expect(screen.getByText(/tidak ada pertanyaan|no matching questions/i)).toBeVisible();
  await search.clear();
  await search.fill("KURIKULUM 2026");
  await expect(question).toBeVisible();
});

test("Keyboard opens the intended learning resource in a separate tab", async ({
  app,
  browser,
  screen,
}) => {
  const url = "https://cs50.harvard.edu/x/";
  await browser.route(url, (route) =>
    route.fulfill({ status: 503, body: "External resource unavailable" }),
  );
  await app.open("/resources");
  const link = screen.getByRole("link", { name: /CS50/i });
  await expect(link).toHaveAttribute("href", url);
  await expect(link).toHaveAttribute("target", "_blank");
  await link.focus();
  await browser.waitForPopup(() => browser.keyboard.press("Enter"));
  await expect(browser).toHaveURL(url);
  expect(browser.tabs()).toHaveLength(2);
});

test("Settings paints its panel above the backdrop and restores focus on close", async ({
  app,
  browser,
  screen,
}) => {
  await app.open("/faq");
  const trigger = screen.getByRole("button", { name: /^(pengaturan|settings)$/i }).first();
  await trigger.focus();
  await browser.keyboard.press("Enter");

  const dialog = screen.getByRole("dialog", { name: /^(pengaturan|settings)$/i });
  const close = dialog.getByRole("button", { name: /tutup dialog|close dialog/i });
  await expect(close).toBeVisible();
  await expect
    .poll(() =>
      browser.evaluate(() => {
        const panel = document.querySelector('[role="dialog"][data-open]');
        if (!panel) return false;
        const bounds = panel.getBoundingClientRect();
        const hit = document.elementFromPoint(
          bounds.left + bounds.width / 2,
          bounds.top + bounds.height / 2,
        );
        return hit !== null && panel.contains(hit);
      }),
    )
    .toBe(true);

  await close.click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
