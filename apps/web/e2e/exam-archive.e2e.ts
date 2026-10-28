import { expect, test } from "@playwright/test";

test("long source course names fit in the folder breadcrumbs", async ({ page }) => {
  await page.goto("/exam");
  await page
    .getByRole("option", { name: /Tren Penelitian Rekayasa Perangkat Lunak dan Data/ })
    .click();
  const breadcrumbs = page.getByRole("navigation", { name: "Lokasi folder" });
  await expect(
    breadcrumbs.getByRole("button", {
      name: "Tren Penelitian Rekayasa Perangkat Lunak dan Data",
      exact: true,
    }),
  ).toHaveAttribute("aria-current", "page");
  expect(await breadcrumbs.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
    true,
  );
});

test("navigation loads the archive on demand and search matches course names only", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/?kurikulum=2026");
  const archiveLink = page
    .getByRole("navigation", { name: "Navigasi aplikasi" })
    .getByRole("link", { name: "Arsip Ujian" });
  await expect(archiveLink).toBeVisible();
  expect(requests.some((url) => /\/assets\/exam-.*\.js/.test(url))).toBe(false);
  await archiveLink.click();
  await expect(page).toHaveURL(/\/exam$/);
  await expect(page.getByRole("heading", { name: "Arsip Ujian", exact: true })).toBeVisible();
  await expect(page.getByRole("tablist", { name: "Versi kurikulum" })).toHaveCount(0);
  const search = page.getByRole("combobox", { name: "Cari mata kuliah" });
  await search.fill("UTS");
  await expect(page.getByText("Tidak ada mata kuliah yang cocok.")).toBeVisible();
  await expect(page.getByRole("option")).toHaveCount(0);
  await search.fill(" basis data ");
  await expect(page.getByRole("option")).toContainText("Basis Data");
  await search.fill("");
  await expect(page.getByRole("option", { name: /Agama Hindu/ })).toBeVisible();
  expect(await page.getByRole("option").count()).toBeGreaterThan(2);
  expect(requests.some((url) => url.includes("drive.google.com"))).toBe(false);
});

test("file rows show type and available creation dates without an outer card", async ({ page }) => {
  await page.goto("/exam");
  await expect(page.getByText("Nama", { exact: true })).toBeVisible();
  await expect(page.getByText("Jenis", { exact: true })).toBeVisible();
  await page.getByRole("option", { name: /Basis Data/ }).click();
  const year = page.getByRole("option", { name: /^2023/ });
  await expect(year).toContainText("Folder");
  await year.click();
  const paper = page.getByRole("option", { name: /2023 BasDat KOMA[.]pdf/ });
  await expect(paper).toContainText("Berkas");
  await expect(paper).toContainText("2026");
  const browser = page.getByRole("region", { name: "Penjelajah arsip ujian" });
  await expect(browser).not.toHaveClass(/border/);
});

test("single-click folders, breadcrumbs, and PDF modal keep previews lazy and disposable", async ({
  page,
}) => {
  let previewRequests = 0;
  await page.route("https://drive.google.com/**", (route) => {
    previewRequests++;
    return route.fulfill({ contentType: "text/html", body: "<p>Drive preview unavailable</p>" });
  });
  await page.goto("/exam");
  await page.getByRole("option", { name: /Basis Data/ }).click();
  await expect(page.getByRole("option").first()).toContainText("2024");
  await page.getByRole("option", { name: /^2023/ }).click();
  await expect(page.getByRole("option")).toHaveCount(4);
  expect(previewRequests).toBe(0);
  await expect(page.locator("iframe")).toHaveCount(0);
  const filename = "2023 BasDat KOMA.pdf";
  await page.getByRole("option", { name: /2023 BasDat KOMA[.]pdf/ }).click();
  const dialog = page.getByRole("dialog", { name: filename });
  await expect(dialog).toBeVisible();
  const frame = dialog.locator("iframe");
  await expect(frame).toHaveAttribute(
    "src",
    "https://drive.google.com/file/d/1olLbQs2FFf_evE1gpQ0VmPTXAGETzu25/preview",
  );
  await expect(page.frameLocator("iframe").getByText("Drive preview unavailable")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Buka di Drive" })).toHaveAttribute(
    "href",
    "https://drive.google.com/file/d/1olLbQs2FFf_evE1gpQ0VmPTXAGETzu25/view",
  );
  await dialog.getByRole("button", { name: "Tutup dialog" }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByRole("listbox", { name: "Isi folder" })).toBeFocused();
  expect(previewRequests).toBe(1);
  await expect(page.getByRole("button", { name: "2023", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByRole("button", { name: "Basis Data", exact: true }).click();
  await expect(page.getByRole("option").first()).toContainText("2024");
  await page.getByRole("button", { name: "Arsip Ujian", exact: true }).click();
  await expect(page.getByRole("option", { name: /Agama Hindu/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("keyboard opens folders and papers, Escape closes the modal and returns focus", async ({
  page,
}) => {
  await page.route("https://drive.google.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<p>Preview</p>" }),
  );
  await page.goto("/exam");
  const search = page.getByRole("combobox", { name: "Cari mata kuliah" });
  await search.fill("Basis Data");
  await search.press("ArrowDown");
  await search.press("Enter");
  const list = page.getByRole("listbox", { name: "Isi folder" });
  await expect(list).toBeFocused();
  await list.press("Home");
  await list.press("Enter");
  await expect(page.getByRole("button", { name: "2024", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await list.press("Home");
  await list.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(list).toBeFocused();
  await expect(page.locator("iframe")).toHaveCount(0);
});
