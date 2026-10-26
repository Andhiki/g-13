import { expect, test, type Page } from "@playwright/test";

async function expectClearRoutes(page: Page) {
  const edges = page.locator("g.react-flow__edge");
  await expect(edges.first()).toBeAttached();
  await expect(page.locator('.react-flow__edge-path[data-routed="true"]')).toHaveCount(
    await edges.count(),
  );
  const collisions = await page.evaluate(() => {
    const obstacles = Array.from(
      document.querySelectorAll<HTMLElement>(".react-flow__node:not(.react-flow__node-lane)"),
    ).map((node) => ({ id: node.dataset.id, rect: node.getBoundingClientRect() }));
    const hits: string[] = [];
    for (const edge of document.querySelectorAll<SVGGElement>("g.react-flow__edge")) {
      const id = edge.dataset.id!;
      const endpoints = id.split("->");
      const path = edge.querySelector<SVGPathElement>(".react-flow__edge-path")!;
      const matrix = path.getScreenCTM()!;
      const length = path.getTotalLength();
      for (let distance = 0; distance <= length; distance += 2) {
        const point = path.getPointAtLength(distance).matrixTransform(matrix);
        const obstacle = obstacles.find(
          (node) =>
            !endpoints.includes(node.id!) &&
            point.x > node.rect.left + 1 &&
            point.x < node.rect.right - 1 &&
            point.y > node.rect.top + 1 &&
            point.y < node.rect.bottom - 1,
        );
        if (obstacle) {
          hits.push(`${id} intersects ${obstacle.id}`);
          break;
        }
      }
    }
    return hits;
  });
  expect(collisions).toEqual([]);
}

for (const curriculum of ["2021", "2026"]) {
  test(`${curriculum}: focused curriculum routes avoid other cards and keep arrowheads`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const course = curriculum === "2021" ? "MII21-1203" : "PACS262201";
    await page.goto(`/?kurikulum=${curriculum}&mk=${course}`);
    await expectClearRoutes(page);
    await expect(page.locator(".react-flow__edge-path").first()).toHaveAttribute(
      "marker-end",
      /url\(/,
    );
  });

  test(`${curriculum}: roadmap routes avoid courses and annotations after a graduation change`, async ({
    page,
  }) => {
    const minat = curriculum === "2021" ? "Lab Rekayasa Perangkat Lunak dan Data" : "Analisis Data";
    await page.goto(
      `/roadmap?kurikulum=${curriculum}&minat=${encodeURIComponent(minat)}&iup=tidak&magang=tidak&hasil=true&lulus=8`,
    );
    await expectClearRoutes(page);
    await page.getByRole("button", { name: "Buka filter roadmap", exact: true }).click();
    await page.getByRole("combobox", { name: "Target selesai", exact: true }).click();
    await page.getByRole("option", { name: "7 semester", exact: true }).click();
    await expect(page).toHaveURL(/lulus=7/);
    await expectClearRoutes(page);
  });
}
