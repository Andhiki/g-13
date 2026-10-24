import { expect, test } from "@playwright/test";

test("connections keep their color over faded course cards", async ({ page }) => {
  test.skip(
    test.info().project.name !== "desktop",
    "Desktop has connections crossing other cards.",
  );
  await page.goto("/?kurikulum=2026");
  await page
    .getByRole("button", { name: "Buka detail Algoritma dan Struktur Data", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  // Wait for the map's animated viewport to settle before sampling pixels.
  await page.waitForTimeout(500);
  const point = await page.evaluate(() => {
    const cards = [...document.querySelectorAll<HTMLElement>(".course-node.unrelated")];
    for (const path of document.querySelectorAll<SVGPathElement>(".react-flow__edge-path")) {
      const matrix = path.getScreenCTM();
      if (!matrix) continue;
      for (let distance = 10; distance < path.getTotalLength() - 10; distance += 4) {
        const local = path.getPointAtLength(distance);
        const screen = new DOMPoint(local.x, local.y).matrixTransform(matrix);
        if (
          screen.x < 410 ||
          screen.x > innerWidth - 5 ||
          screen.y < 280 ||
          screen.y > innerHeight - 5
        )
          continue;
        const card = cards.find((element) => {
          const rect = element.getBoundingClientRect();
          return (
            screen.x > rect.left + 8 &&
            screen.x < rect.right - 8 &&
            screen.y > rect.top + 8 &&
            screen.y < rect.bottom - 8
          );
        });
        if (card) return { x: Math.floor(screen.x), y: Math.floor(screen.y) };
      }
    }
    return null;
  });
  expect(point, "A connection must cross a faded card in this fixture").not.toBeNull();
  if (!point) return;
  const clip = { ...point, width: 1, height: 1 };
  const overlapping = await page.screenshot({ clip });
  await page.locator(".course-node.unrelated").evaluateAll((cards) => {
    for (const card of cards) (card as HTMLElement).style.visibility = "hidden";
  });
  const unobstructed = await page.screenshot({ clip });
  expect(overlapping.equals(unobstructed), "The card must not tint the connection").toBe(true);
});
