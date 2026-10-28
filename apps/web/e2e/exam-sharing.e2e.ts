import { expect, test } from "@playwright/test";

const courseId = "1ytONm6E_hsyid1fcycPq3khpASeqKU33";
const paperId = "1olLbQs2FFf_evE1gpQ0VmPTXAGETzu25";
const filename = "2023 BasDat KOMA.pdf";
const folderUrl = `/exam?course=${courseId}&year=2023`;
const paperUrl = `${folderUrl}&file=${paperId}`;

test.beforeEach(async ({ page }) => {
  await page.route("https://drive.google.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<p>Preview</p>" }),
  );
});

test("fresh folder and paper links restore their locations; closing a direct modal keeps its folder", async ({
  page,
}) => {
  await page.goto(folderUrl);
  await expect(page.getByRole("button", { name: "2023", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("option")).toHaveCount(4);
  await page.reload();
  await expect(page.getByRole("option")).toHaveCount(4);
  await page.goto(paperUrl);
  const dialog = page.getByRole("dialog", { name: filename });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("iframe")).toHaveCount(1);
  await page.reload();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Tutup dialog" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "2023", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(new URL(page.url()).searchParams.has("file")).toBe(false);
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.goBack();
  await expect(dialog).toBeVisible();
  await page.goForward();
  await expect(dialog).toHaveCount(0);
});

test("Back and Forward restore folders and preview without duplicate frames", async ({ page }) => {
  await page.goto("/exam");
  await page.getByRole("option", { name: /Basis Data/ }).click();
  await page.getByRole("option", { name: /^2023/ }).click();
  await page.getByRole("option", { name: /2023 BasDat KOMA[.]pdf/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByRole("option")).toHaveCount(4);
  await page.goBack();
  await expect(page.getByRole("button", { name: "Basis Data", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.goForward();
  await expect(page.getByRole("button", { name: "2023", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.goForward();
  await expect(page.getByRole("dialog", { name: filename })).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(1);
});

test("copy shares the in-app modal URL and failed clipboard writes offer manual copying", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(paperUrl);
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Salin tautan" }).click();
  await expect(dialog.getByRole("button", { name: "Tautan berhasil disalin" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
  await page.reload();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("Denied")) },
    }),
  );
  await dialog.getByRole("button", { name: "Salin tautan" }).click();
  await expect(
    dialog.getByText("Gagal menyalin otomatis. Salin tautan berikut.", { exact: true }),
  ).toBeVisible();
  const input = dialog.getByRole("textbox", { name: "Tautan berkas" });
  await expect(input).toHaveValue(page.url());
  await input.focus();
  expect(
    await input.evaluate(
      (element: HTMLInputElement) => element.selectionEnd! - element.selectionStart!,
    ),
  ).toBe(page.url().length);
});

test("download uses the source attachment and mobile modal controls fit", async ({
  page,
  context,
}) => {
  await context.route("https://drive.google.com/uc?**", (route) =>
    route.fulfill({
      contentType: "application/pdf",
      headers: { "Content-Disposition": 'attachment; filename="exam.pdf"' },
      body: "%PDF-1.7\n",
    }),
  );
  await page.goto(paperUrl);
  const dialog = page.getByRole("dialog");
  const downloadLink = dialog.getByRole("link", { name: "Unduh", exact: true });
  await expect(downloadLink).toHaveAttribute(
    "href",
    `https://drive.google.com/uc?export=download&id=${paperId}`,
  );
  const [download] = await Promise.all([page.waitForEvent("download"), downloadLink.click()]);
  expect(download.suggestedFilename()).toBe("exam.pdf");
  await expect(dialog.getByRole("link", { name: "Buka di Drive" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Salin tautan" })).toBeVisible();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await download.cancel();
});

test("malformed or mismatched locations never open an unrelated paper", async ({ page }) => {
  for (const url of [
    "/exam?course=%7B%22bad%22:true%7D&year=2023&file=missing",
    `/exam?file=${paperId}`,
    `/exam?course=missing&year=2023&file=${paperId}`,
  ]) {
    await page.goto(url);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.getByRole("option", { name: /Basis Data/ })).toBeVisible();
  }
  await page.goto(`/exam?course=${courseId}&year=2024&file=${paperId}`);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "2024", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
