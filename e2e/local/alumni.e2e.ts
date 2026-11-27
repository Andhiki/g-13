import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("Featured alumni links to the directory, with search and cohort filtering", async ({
  app,
  screen,
}) => {
  await app.open("/alumni");
  await expect(screen.getByRole("region", { name: /kisah alumni|alumni stories/i })).toBeVisible();
  await screen.getByRole("link", { name: /jelajahi semua alumni|explore all alumni/i }).click();
  const search = screen.getByRole("searchbox");
  await expect(screen.getByText("Alya Fixture")).toBeVisible();
  await screen.getByRole("tab", { name: /2020/ }).click();
  await expect(screen.getByText("Bima Fixture")).toBeVisible();
  await expect(screen.getByText("Citra Fixture")).toBeHidden();
  await search.fill("bima");
  await expect(screen.getByText("Bima Fixture")).toBeVisible();
  await expect(screen.getByText("Alya Fixture")).toBeHidden();
  await search.fill("Nobody like this");
  await expect(screen.getByText(/tidak ada alumni|no alumni/i)).toBeVisible();
  await search.clear();
  await screen.getByRole("tab", { name: /^(semua|all)( angkatan| cohorts)?$/i }).click();
  await expect(screen.getByText("Citra Fixture")).toBeVisible();
});

test("A failed initial alumni load recovers via the real retry endpoint", async ({
  app,
  browser,
  screen,
}) => {
  await browser.route("**/alumni/all", (route) =>
    route.continue({
      headers: { ...route.request.headers, "x-e2e-alumni-failure": "1" },
    }),
  );
  await app.open("/alumni/all");
  const retry = screen.getByRole("button", { name: /coba lagi|try again/i });
  await expect(retry).toBeVisible();
  const response = browser.waitForResponse("**/api/alumni");
  await retry.click();
  expect((await response).status).toBe(200);
  await expect(retry).toBeHidden();
  await expect(screen.getByText("Alya Fixture")).toBeVisible();
  await screen.getByRole("tab", { name: /2021/ }).click();
  await screen.getByRole("searchbox").fill("citra");
  await expect(screen.getByText("Citra Fixture")).toBeVisible();
});
