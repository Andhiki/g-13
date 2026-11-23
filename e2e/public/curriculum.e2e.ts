import { test } from "@e2e-dev/web";
import { expect } from "e2e";

const courseTitle = /^(algoritma dan struktur data|algorithms and data structures)$/i;
const courseTrigger = /cari mata kuliah|search courses/i;
const closeDetails = /tutup detail mata kuliah|close course details/i;

for (const { edition, code } of [
  { edition: "2021", code: "MII21-1203" },
  { edition: "2026", code: "PACS262201" },
]) {
  test(`Curriculum ${edition}: find a course, inspect prerequisites, and reopen its link`, async ({
    app,
    browser,
    screen,
  }) => {
    await app.open(`/?kurikulum=${encodeURIComponent(JSON.stringify(edition))}`);
    await expect(screen.getByRole("button", { name: courseTrigger })).toBeVisible();
    await browser.keyboard.press("/");
    const search = screen.getByRole("combobox", { name: courseTrigger });
    await expect(search).toBeFocused();
    await search.fill("E2E_MISSING_COURSE");
    await expect(screen.getByText(/tidak ada mata kuliah|no courses match/i)).toBeVisible();
    await search.clear();
    await search.fill(code);
    await screen.getByRole("option", { name: new RegExp(code, "i") }).click();
    const title = screen.getByRole("heading", { name: courseTitle });
    await expect(title).toBeVisible();
    await expect(screen.getByText(/^(prasyarat|prerequisites)$/i).first()).toBeVisible();
    await expect(
      screen.getByRole("dialog", { name: courseTitle }).getByRole("button", {
        name: /^(buka detail pemrograman|open details? (?:for )?programming)$/i,
      }),
    ).toBeVisible();
    const link = await browser.url();
    expect(new URL(link).searchParams.get("mk")).toContain(code);
    await screen.getByRole("button", { name: /tampilkan daftar|show list/i }).click();
    await expect(screen.getByRole("heading", { name: /^(mata kuliah|courses)$/i })).toBeVisible();
    expect(new URL(await browser.url()).searchParams.get("kurikulum")).toContain(edition);
    await app.open(link);
    await expect(title).toBeVisible();
    await expect(screen.getByRole("button", { name: closeDetails })).toBeVisible();
  });
}

test("An unknown course deep link leaves the explorer usable", async ({ app, browser, screen }) => {
  await app.open("/?kurikulum=%222026%22&mk=E2E_UNKNOWN");
  const trigger = screen.getByRole("button", { name: courseTrigger });
  await expect(screen.getByRole("button", { name: closeDetails })).toBeHidden();
  await trigger.click();
  await screen.getByRole("combobox", { name: courseTrigger }).fill("PACS262201");
  await screen.getByRole("option", { name: /PACS262201/i }).click();
  await expect(screen.getByRole("heading", { name: courseTitle })).toBeVisible();
  await screen.getByRole("button", { name: /pilih kurikulum|choose curriculum/i }).click();
  await screen.getByRole("tab", { name: /2021/ }).press("Enter");
  await expect(browser).toHaveURL(/kurikulum=%222021%22/);
  await expect(screen.getByRole("button", { name: closeDetails })).toBeHidden();
});
