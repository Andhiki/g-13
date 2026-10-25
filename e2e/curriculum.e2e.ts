import { expect, test } from "@playwright/test";

for (const curriculum of [
  { edition: "2021", selected: "MII21-1203", prerequisite: "MII21-1201" },
  { edition: "2026", selected: "PACS262201", prerequisite: "PAKF262105" },
]) {
  test(`${curriculum.edition}: open a graph course, follow prerequisites, and restore a direct link`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/?kurikulum=${curriculum.edition}`);
    const selected = page.locator(`[data-id="${curriculum.selected}"] button`);
    await selected.click();
    const details = page.getByRole("dialog");
    await expect(
      details.getByRole("heading", { name: "Algoritma dan Struktur Data", exact: true }),
    ).toBeVisible();
    await expect(selected).toHaveAttribute("aria-pressed", "true");
    const incoming = page.locator(
      `[data-testid="rf__edge-${curriculum.prerequisite}->${curriculum.selected}"] .react-flow__edge-path`,
    );
    await expect(incoming).toBeAttached();
    await expect(incoming).toHaveAttribute("d", /^M.+C/);
    await expect(incoming).toHaveAttribute("marker-end", /url\(.+\)/);
    await expect(incoming).toHaveCSS("stroke-width", "2.2px");
    await expect(page.locator("[data-course-state=dependent]").first()).toBeAttached();
    await expect(details.getByRole("heading", { name: "Lokasi sumber" })).toHaveCount(0);
    await expect(details.getByRole("heading", { name: "Prasyarat", exact: true })).toHaveCount(1);
    await expect(details.getByText("Prasyarat tidak tercantum.", { exact: true })).toHaveCount(0);
    await details.getByRole("button", { name: "Buka detail Pemrograman", exact: true }).click();
    await expect(details.getByRole("heading", { name: "Pemrograman", exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`mk=${curriculum.prerequisite}`));
    await page.reload();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name: "Pemrograman", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Tutup detail mata kuliah" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".react-flow__edge-path")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test(`${curriculum.edition}: search by keyboard, navigate the list, and retain the theme after reload`, async ({
    page,
    isMobile,
  }) => {
    await page.goto(`/?kurikulum=${curriculum.edition}`);
    await expect(page.locator(".react-flow__node-course").first()).toBeVisible();
    const trigger = page.getByRole("button", { name: "Cari mata kuliah", exact: true });
    await trigger.click();
    const input = page.getByRole("combobox", { name: "Cari mata kuliah" });
    await input.fill("no-such-course-xyz");
    await expect(
      page.getByText("Tidak ada mata kuliah yang cocok.", { exact: true }),
    ).toBeVisible();
    if (isMobile) await page.getByRole("button", { name: "Tutup pencarian" }).click();
    else await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await page.keyboard.press("/");
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("");
    await input.press("/");
    await expect(input).toHaveValue("/");
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await input.fill(curriculum.selected);
    await input.press("ArrowDown");
    await input.press("Enter");
    await expect(
      page
        .getByRole("dialog")
        .getByRole("heading", { name: "Algoritma dan Struktur Data", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Tutup detail mata kuliah" }).click();
    await page.getByRole("button", { name: "Switch View", exact: true }).click();
    await expect(page.getByRole("table").first()).toBeVisible();
    const religionCourses = page.getByRole("button", { name: /^Buka detail Agama/ });
    await expect(religionCourses.first()).toBeVisible();
    await page.getByRole("button", { name: "Semester 2", exact: true }).click();
    await expect(page.getByRole("button", { name: "Semester 2", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(religionCourses.first()).toBeAttached();
    await page
      .getByRole("button", { name: "Buka detail Algoritma dan Struktur Data", exact: true })
      .click();
    await expect(
      page
        .getByRole("dialog")
        .getByRole("heading", { name: "Algoritma dan Struktur Data", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page.emulateMedia({ colorScheme: "light" });
    await page.getByRole("button", { name: "Ganti ke tema gelap", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("button", { name: "Ganti ke tema terang", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/light/);
  });
}
