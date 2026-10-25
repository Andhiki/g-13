import { expect, test } from "@playwright/test";

test("focus gathers connections, follows neighbors, and restores semester navigation", async ({
  page,
  isMobile,
}) => {
  await page.goto("/?kurikulum=2026");
  await page.getByRole("button", { name: "Semester 2", exact: true }).click();
  const count = await page.locator(".react-flow__node-course").count();
  const selected = page.locator('[data-id="PACS262201"]');
  const original = await selected.getAttribute("style");
  await selected.getByRole("button").click();
  await expect(page.locator("[data-course-state=unrelated]")).toHaveCount(0);
  await expect(page.locator("[data-map-lane]")).toHaveCount(0);
  await expect(page.locator("[data-course-state=prerequisite]").first()).toBeVisible();
  await expect(page.locator("[data-course-state=dependent]").first()).toBeVisible();
  expect(await selected.getAttribute("style")).toBe(original);
  await expect
    .poll(() =>
      page.locator(".react-flow__node-course").evaluateAll((nodes) =>
        nodes.every((node) => {
          const rect = node.getBoundingClientRect();
          return (
            rect.left >= (innerWidth < 650 ? 0 : 400) &&
            rect.right <= innerWidth &&
            rect.top >= 96 &&
            rect.bottom <= innerHeight * (innerWidth < 650 ? 0.55 : 1)
          );
        }),
      ),
    )
    .toBe(true);
  await page.locator("[data-course-state=prerequisite] button").first().click();
  await expect(page).not.toHaveURL(/mk=PACS262201/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".react-flow__node-course")).toHaveCount(count);
  await expect(page.getByRole("button", { name: "Semester 2", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await selected.getByRole("button").click();
  await page.getByRole("button", { name: "Semester 3", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/?kurikulum=2026&mk=PACS262201");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator(".react-flow__pane").click({
    position: {
      x: isMobile ? 10 : page.viewportSize()!.width - 10,
      y: isMobile ? 300 : page.viewportSize()!.height - 100,
    },
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

for (const theme of ["light", "dark"] as const) {
  test(`graph styling preserves course states and edge colors in ${theme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/?kurikulum=2026");
    const core = page.locator('[data-course="PACS262201"]');
    const choice = page.locator('[data-course-kind="choice"]').first();
    await expect(core).toHaveCSS("width", "246px");
    await expect(choice).toHaveCSS("opacity", "1");
    const coreTitle = await core.locator("strong").evaluate((node) => getComputedStyle(node).color);
    await expect(choice.locator("strong")).not.toHaveCSS("color", coreTitle);
    await core.getByRole("button").click();
    const incoming = page.locator('[data-testid="rf__edge-PAKF262105->PACS262201"] path').first();
    await expect(incoming).toHaveCSS("stroke-width", "2.2px");
    await expect(incoming).toHaveCSS("stroke-linecap", "round");
    const prerequisiteHandle = page
      .locator('[data-course-state="prerequisite"] .react-flow__handle')
      .first();
    await expect(prerequisiteHandle).toHaveCSS("width", "7px");
    const relationshipColor = await prerequisiteHandle.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await expect(incoming).toHaveCSS("stroke", relationshipColor);
    const selectedHandle = core.locator(".react-flow__handle").first();
    const selectedColor = await selectedHandle.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await expect(core.locator('[aria-hidden="true"]')).toHaveCSS("border-top-color", selectedColor);
    await expect(
      page.locator('[data-course-kind="choice"][data-course-state="dependent"] strong').first(),
    ).toHaveCSS("color", coreTitle);
  });
}
