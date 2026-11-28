import { test } from "@e2e-dev/web";
import { expect } from "e2e";

const course = "Agama Hindu";
const paper = "Agama Hindu - UAS - 2020 - Reg A.pdf";
const fileId = "1bcr4x-t7ysNPH4GEUxvTjw1Y0rlQxppi";
const courseId = "1fFKbV60PkrCgd7PTCnxSwHusBnk_z_oD";

test("Search for a paper, preview it, and recover focus and location on close", async ({
  app,
  browser,
  screen,
}) => {
  await browser.route("https://drive.google.com/**", (route) =>
    route.fulfill({ status: 200, body: "Preview fixture" }),
  );
  await app.open("/exam");
  const search = screen.getByLabel(/cari mata kuliah|search courses/i);
  await search.fill("E2E missing exam");
  await expect(screen.getByText(/tidak ada mata kuliah|no courses match/i)).toBeVisible();
  await search.fill(course);
  const folder = screen.getByRole("link", { name: /agama hindu/i });
  await expect(folder).toBeVisible();
  await search.press("ArrowDown");
  await expect(folder).toBeFocused();
  await folder.press("Enter");
  await screen.getByRole("link", { name: /2020/ }).click();
  const entry = screen.getByRole("link", { name: /agama hindu - uas - 2020/i });
  await entry.click();
  const dialog = screen.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(paper, { exact: true }).first()).toBeVisible();
  const open = dialog.getByRole("link", { name: /buka di drive|open in drive/i });
  await expect(open).toHaveAttribute(
    "href",
    new RegExp(`^https://drive\\.google\\.com/.*${fileId}`),
  );
  await expect(open).toHaveAttribute("target", "_blank");
  await expect(dialog.getByRole("link", { name: /unduh|download/i })).toHaveAttribute(
    "href",
    new RegExp(fileId),
  );
  const deepLink = await browser.url();
  await dialog.getByRole("button", { name: /tutup dialog|close dialog/i }).click();
  await expect(entry).toBeFocused();
  await screen
    .getByRole("navigation", { name: /lokasi folder|folder location/i })
    .getByRole("link", { name: course })
    .click();
  await expect(screen.getByRole("link", { name: /2020/ })).toBeVisible();
  await app.open(deepLink);
  await expect(dialog.getByText(paper, { exact: true }).first()).toBeVisible();
});

for (const invalid of [
  "course=E2E_MISSING&year=2020&file=missing",
  `course=${courseId}&year=missing&file=missing`,
  `course=${courseId}&year=2020&file=missing`,
]) {
  test(`Invalid exam location recovers: ${invalid.replace(courseId, "known-course")}`, async ({
    app,
    screen,
  }) => {
    await app.open(`/exam?${invalid}`);
    await expect(screen.getByRole("dialog")).toBeHidden();
    await expect(
      screen.getByRole("navigation", { name: /lokasi folder|folder location/i }),
    ).toBeVisible();
    await screen.getByRole("link", { name: /arsip ujian.*direktori|exam archive.*home/i }).click();
    await expect(screen.getByRole("link", { name: /agama hindu/i })).toBeVisible();
  });
}
