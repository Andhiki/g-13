import { expect, type TestFixtures } from "e2e";
import type { WebFixtures } from "@e2e-dev/web";
import { fixture } from "../database.ts";

export const profile = `/lecturers/${fixture.lecturerId}`;

type ReviewPage = Pick<TestFixtures & WebFixtures, "app" | "browser" | "screen">;

export async function fillReview(
  { app, browser, screen }: ReviewPage,
  body: string,
  options: { author?: string; rejected?: boolean } = {},
) {
  const token = options.rejected ? "e2e-rejected" : "e2e-verified";
  await browser.route("https://challenges.cloudflare.com/turnstile/**", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `(() => {
      let callback;
      window.turnstile = {
        render: (_container, options) => { callback = options.callback; return 'e2e'; },
        execute: () => callback(${JSON.stringify(token)}),
        reset: () => {},
        remove: () => {},
      };
    })();`,
    }),
  );
  await app.open(profile);
  await screen
    .getByRole("button", { name: /^(tulis ulasan|write a review)$/i })
    .first()
    .click();
  const dialog = screen.getByRole("dialog");
  await dialog.getByRole("combobox", { name: /^(mata kuliah|course)$/i }).fill("E2E101");
  await dialog.getByRole("option", { name: /E2E101/i }).click();
  await dialog.getByRole("combobox", { name: /^(semester|periode|term)$/i }).press("ArrowDown");
  await expect(screen.getByRole("option").first()).toBeFocused();
  await browser.keyboard.press("Enter");
  for (const metric of [
    /kejelasan|clarity/i,
    /dukungan|support/i,
    /pengorganisasian|organization/i,
  ]) {
    const rating = dialog.getByRole("radio", {
      name: new RegExp(`(?:${metric.source}).*5 (?:dari|of) 5`, "i"),
    });
    await rating.click();
  }
  await dialog.getByLabel(/pengalamanmu|pengalaman anda|your experience/i).fill(body);
  if (options.author !== undefined) {
    await dialog.getByLabel(/terbitkan sebagai anonim|publish as anonymous/i).click();
    await dialog.getByLabel(/nama tampilan|display name/i).fill(options.author);
  }
  await expect.poll(() => browser.evaluate(() => "turnstile" in window)).toBe(true);
  return dialog.getByRole("button", { name: /kirim ulasan|submit review/i });
}
