import { test } from "@e2e-dev/web";
import { expect } from "e2e";

for (const { edition, semesters } of [
  { edition: "2021", semesters: 8 },
  { edition: "2026", semesters: 7 },
]) {
  test(`Roadmap ${edition}: generate a ${semesters}-semester plan and reopen its shared link`, async ({
    app,
    browser,
    screen,
  }) => {
    await browser.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new Error("Clipboard unavailable")) },
      });
    });
    await app.open("/roadmap");
    const answers = screen.getByRole("group", { name: /pilihan jawaban|answer choices/i });
    const next = screen.getByRole("button", { name: /^(lanjut|next)$/i });
    await answers.getByRole("button", { name: edition }).click();
    await next.click();
    await answers.getByRole("button", { name: /reguler|regular/i }).click();
    await next.click();
    const interest = answers.getByRole("button").first();
    await interest.click();
    await next.click();
    await screen.getByRole("button", { name: /^(kembali|back)$/i }).click();
    await expect(interest).toHaveAttribute("aria-pressed", "true");
    await next.click();
    await answers.getByRole("button", { name: /^(tidak|no)$/i }).click();
    await screen.getByRole("button", { name: /lihat roadmap|view roadmap/i }).click();

    const target = screen.getByText(`${semesters} semester`, { exact: false }).first();
    if (!(await target.isVisible())) {
      await screen
        .getByRole("button", { name: /buka filter roadmap|open roadmap filters/i })
        .click();
    }
    await target.click();
    const share = screen.getByRole("button", { name: /^bagikan$|^share$/i });
    await share.click();
    const link = await screen.getByLabel(/tautan roadmap|roadmap link/i).inputValue();
    const params = new URL(link).searchParams;
    expect(params.get("kurikulum")).toContain(edition);
    expect(params.get("lulus")).toBe(String(semesters));
    await app.clearState();
    await app.open(link);
    await expect(share).toBeVisible();
    expect(new URL(await browser.url()).searchParams.get("lulus")).toBe(String(semesters));
    await expect(
      screen.getByText(new RegExp(`(?:semester ${semesters}|${semesters} semester)`, "i")).first(),
    ).toBeVisible();
  });
}

test("Incomplete roadmap resumes at the first missing applicable answer", async ({
  app,
  screen,
}) => {
  await app.open("/roadmap?kurikulum=%222026%22&iup=ya&minat=invalid&langkah=magang");
  await expect(screen.getByRole("heading", { name: /exposure apa|which exposure/i })).toBeVisible();
  const choices = screen.getByRole("group", { name: /pilihan jawaban|answer choices/i });
  const next = screen.getByRole("button", { name: /^(lanjut|next)$/i });
  await choices.getByRole("button").first().click();
  await next.click();
  await choices.getByRole("button").first().click();
  await next.click();
  await choices.getByRole("button", { name: /^(tidak|no)$/i }).click();
  await screen.getByRole("button", { name: /lihat roadmap|view roadmap/i }).click();
  await expect(screen.getByRole("button", { name: /^bagikan$|^share$/i })).toBeVisible();
});

test("A supported elective replacement survives sharing and a reload", async ({
  app,
  browser,
  screen,
}) => {
  const search = new URLSearchParams({
    kurikulum: '"2026"',
    minat: "Analisis Data",
    iup: "tidak",
    magang: "tidak",
    hasil: "true",
  });
  await browser.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("Clipboard unavailable")) },
    });
  });
  await app.open(`/roadmap?${search}`);
  const original = screen.getByRole("button", {
    name: /buka detail temu balik informasi|open details? .*information retrieval/i,
  });
  await original.press("Enter");
  await screen.getByRole("button", { name: /ganti mata kuliah pilihan|replace elective/i }).click();
  const dialog = screen.getByRole("dialog", {
    name: /ganti mata kuliah pilihan|replace elective/i,
  });
  await dialog.getByRole("combobox").press("ArrowDown");
  await screen
    .getByRole("option", { name: /algoritma untuk trading|algorithms for trading/i })
    .press("Enter");
  await dialog.getByRole("button", { name: /gunakan mata kuliah ini|use this course/i }).click();
  await expect(dialog).toBeHidden();
  await screen
    .getByRole("button", { name: /tutup detail mata kuliah|close course details/i })
    .click();
  await browser.reload();
  await screen.getByRole("button", { name: /^bagikan$|^share$/i }).press("Enter");
  const link = await screen.getByLabel(/tautan roadmap|roadmap link/i).inputValue();
  expect(JSON.parse(new URL(link).searchParams.get("ganti") ?? "{}")).toEqual({
    PACS262422: "PACS262402",
  });
  await app.clearState();
  await app.open(link);
  await browser.reload();
  await expect(
    screen.getByRole("button", {
      name: /buka detail algoritma untuk trading|open details? .*algorithms for trading/i,
    }),
  ).toBeVisible();
  await expect(original).toBeHidden();
});
