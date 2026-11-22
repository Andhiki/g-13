import { test } from "@e2e-dev/web";
import { expect } from "e2e";
import { notFound, protectedRoutes, publicRoutes } from "../routes.ts";
import { sharedOrigin } from "../targets.ts";

test.beforeEach(async ({ browser }) => {
  await browser.route("**/*", async (route) => {
    if (
      new URL(route.request.url).origin !== sharedOrigin ||
      !["GET", "HEAD"].includes(route.request.method)
    ) {
      await route.abort();
      return;
    }
    await route.continue();
  });
});

for (const { path, primary } of publicRoutes) {
  test(`GET ${path} shows its primary content after refresh`, async ({ app, browser, screen }) => {
    const marker = screen.getByRole(path === "/" ? "button" : "heading", { name: primary }).first();
    await app.open(path);
    await expect(marker).toBeVisible();
    await browser.reload();
    await expect(marker).toBeVisible();
  });
}

test("GET /alumni/all loads the live directory", async ({ app, browser, screen }) => {
  await app.open("/alumni");
  await screen.getByRole("link", { name: /jelajahi semua alumni|explore all alumni/i }).click();
  await expect(screen.getByRole("heading", { name: /semua alumni|all alumni/i })).toBeVisible();
  const status = await browser.evaluate(async () => (await fetch("/api/alumni")).status);
  expect(status, `Shared staging alumni upstream returned HTTP ${status}`).toBe(200);
  await expect(
    screen.getByRole("button", { name: /coba lagi|try again/i }),
    "Shared staging could not load the alumni directory on entry",
  ).toBeHidden();
  await expect(screen.getByRole("searchbox")).toBeVisible();
});

test("GET /lecturers/afiahayati loads a public lecturer profile", async ({ app, screen }) => {
  await app.open("/lecturers/afiahayati");
  await expect(screen.getByRole("heading", { name: "Afiahayati" })).toBeVisible();
});

test("GET /lecturers/missing-lecturer shows the not-found screen", async ({ app, screen }) => {
  await app.open("/lecturers/missing-lecturer");
  await expect(screen.getByRole("heading", { name: notFound })).toBeVisible();
});

for (const path of protectedRoutes) {
  test(`GET ${path} redirects signed-out visitors`, async ({ app, browser, screen }) => {
    await app.open(path);
    await expect(browser).toHaveURL(/\/dashboard\/login\/?(?:[?#]|$)/);
    await expect(screen.getByRole("button", { name: "Sign in with GitHub" })).toBeVisible();
  });
}

test("GET /dashboard/login shows the GitHub sign-in entry", async ({ app, screen }) => {
  await app.open("/dashboard/login");
  await expect(screen.getByRole("button", { name: "Sign in with GitHub" })).toBeVisible();
});

test("GET /missing-app-page offers a link back to the curriculum", async ({
  app,
  browser,
  screen,
}) => {
  await app.open("/missing-app-page");
  await expect(screen.getByRole("heading", { name: notFound })).toBeVisible();
  await screen.getByRole("link", { name: /^(kembali|back)$/i }).click();
  await expect(browser).toHaveURL(new RegExp(`^${sharedOrigin.replaceAll(".", "\\.")}/(?:[?#]|$)`));
});
