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
  test(`${curriculum}: focused curriculum routes avoid other cards and have no arrowheads`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const course = curriculum === "2021" ? "MII21-1203" : "PACS262201";
    await page.goto(`/?kurikulum=${curriculum}&mk=${course}`);
    await expectClearRoutes(page);
    await expect(page.locator(".react-flow__edge-path").first()).not.toHaveAttribute("marker-end");
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

for (const route of ["/", "/roadmap"]) {
  test(`${route}: prerequisites finish before unlocked connections animate`, async ({ page }) => {
    await page.goto(
      route === "/"
        ? "/?kurikulum=2026"
        : "/roadmap?kurikulum=2026&minat=Analisis%20Data&iup=tidak&magang=tidak&hasil=true&lulus=8",
    );
    await page.locator('[data-id="PACS262201"] button').click();
    const frames = await page.evaluate(async () => {
      const frames: { incoming: number[]; outgoing: number[] }[] = [];
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const sample = () => {
          const progress = (selector: string) =>
            Array.from(document.querySelectorAll<SVGPathElement>(selector)).map(
              (path) => 1 - Number(path.style.strokeDashoffset),
            );
          frames.push({
            incoming: progress('g[data-id$="->PACS262201"] .react-flow__edge-path'),
            outgoing: progress('g[data-id^="PACS262201->"] .react-flow__edge-path'),
          });
          if (performance.now() - start < 2600) requestAnimationFrame(sample);
          else resolve();
        };
        requestAnimationFrame(sample);
      });
      return frames;
    });
    expect(frames.some((frame) => frame.incoming.some((value) => value > 0 && value < 1))).toBe(
      true,
    );
    expect(frames.some((frame) => frame.outgoing.some((value) => value > 0 && value < 1))).toBe(
      true,
    );
    expect(
      frames
        .filter((frame) => frame.outgoing.some((value) => value > 0))
        .every(
          (frame) => frame.incoming.length > 0 && frame.incoming.every((value) => value === 1),
        ),
    ).toBe(true);
    await expect(page.locator(".react-flow__edge-path[marker-end]")).toHaveCount(0);
  });
}

test("aligned prerequisite connection stays horizontal all the way to its target", async ({
  page,
}) => {
  await page.goto("/?kurikulum=2026&mk=PACS262207");
  const path = page.locator('g[data-id$="->PACS262207"] .react-flow__edge-path').first();
  await expect(path).toBeAttached();
  await expect(path).toHaveCSS("stroke-dashoffset", "0px");
  const deviation = await path.evaluate((element: SVGPathElement) => {
    const length = element.getTotalLength();
    const start = element.getPointAtLength(0);
    const end = element.getPointAtLength(length);
    const ys = Array.from(
      { length: 101 },
      (_, i) => element.getPointAtLength((length * i) / 100).y,
    );
    return { endpoints: Math.abs(end.y - start.y), path: Math.max(...ys) - Math.min(...ys) };
  });
  expect(deviation.endpoints).toBeLessThan(0.1);
  expect(deviation.path).toBeLessThan(0.1);
});
