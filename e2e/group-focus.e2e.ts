import { expect, test } from "@playwright/test";

test("choice groups fit their actual courses inside the unobstructed canvas", async ({
  page,
  isMobile,
}) => {
  await page.goto("/?kurikulum=2026");
  for (const group of ["Wirausaha Digital", "Semua mata kuliah", "Wirausaha Digital"]) {
    const trigger = page.getByRole("button", { name: /^(Buka|Tutup) filter kurikulum$/ });
    if (isMobile || (await trigger.getAttribute("aria-expanded")) === "false")
      await trigger.click();
    await page.getByRole("combobox", { name: /Kelompok pilihan/ }).click();
    await page.getByRole("option", { name: new RegExp(`^${group}`) }).click();
    if (isMobile)
      await page.getByRole("button", { name: "Tampilkan mata kuliah", exact: true }).click();
    if (group === "Semua mata kuliah") continue;
    await expect
      .poll(async () =>
        page.locator(".react-flow__node-course").evaluateAll((nodes) => {
          const transform = document.querySelector(".react-flow__viewport")!;
          const scale = new DOMMatrixReadOnly(getComputedStyle(transform).transform).a;
          const compact = innerWidth < 1100;
          const choices = nodes.filter((node) => {
            const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
            return matrix.m41 >= 48 + 8 * 360;
          });
          return (
            choices.length > 0 &&
            scale <= 0.881 &&
            choices.every((node) => {
              const rect = node.getBoundingClientRect();
              return (
                rect.left >= 16 &&
                rect.top >= (compact ? 128 : 96) &&
                rect.right <= innerWidth - (compact ? 16 : 332) &&
                rect.bottom <= innerHeight - 72
              );
            })
          );
        }),
      )
      .toBe(true);
  }
});
