import { test, expect } from "@playwright/test";

const roadmap =
  "/roadmap?kurikulum=2026&minat=Analisis+Data&iup=tidak&magang=tidak&lulus=8&hasil=true";

async function settled(page) {
  await page.waitForFunction(() => {
    const graph = document.querySelector(".react-flow__viewport");
    const signature = graph?.outerHTML;
    if (signature !== window.focusSignature) {
      window.focusSignature = signature;
      window.focusChanged = performance.now();
    }
    return graph && performance.now() - window.focusChanged > 250;
  });
}

async function sample(page, id, action) {
  return page.evaluate(
    ({ id, action }) =>
      new Promise((resolve) => {
        const frames = [];
        const element = document.querySelector(`[data-course="${id}"]`);
        const started = performance.now();
        let previous;
        let changed = started;
        if (action === "select") element.querySelector("button").click();
        else document.querySelector('button[aria-label="Tutup detail mata kuliah"]').click();
        function frame() {
          const box = element.getBoundingClientRect();
          const viewport = document.querySelector(".react-flow__viewport");
          const matrix = new DOMMatrixReadOnly(getComputedStyle(viewport).transform);
          let edgeError = 0;
          let edgeCount = 0;
          let edgeIssue;
          for (const edge of document.querySelectorAll(".react-flow__edge")) {
            const path = edge.querySelector(".react-flow__edge-path");
            if (!path || Number(getComputedStyle(path.parentElement).opacity) < 0.01) continue;
            const [source, target] = edge.dataset.id.split("->");
            for (const [nodeId, handle, distance] of [
              [source, "out", 0],
              [target, "in", path.getTotalLength()],
            ]) {
              const port = document.querySelector(
                `[data-id="${nodeId}"] [data-handleid="${handle}"]`,
              );
              if (!port) continue;
              const point = path.getPointAtLength(distance).matrixTransform(path.getScreenCTM());
              const bounds = port.getBoundingClientRect();
              const error = Math.hypot(
                point.x - (handle === "out" ? bounds.right : bounds.left),
                point.y - bounds.y - bounds.height / 2,
              );
              if (error > edgeError) {
                edgeError = error;
                edgeIssue = {
                  edge: edge.dataset.id,
                  handle,
                  point: { x: point.x, y: point.y },
                  port: { x: bounds.x, y: bounds.y },
                  path: path.getAttribute("d"),
                };
              }
              edgeCount++;
            }
          }
          const positions = Object.fromEntries(
            [...document.querySelectorAll(".react-flow__node-course")].map((node) => {
              const transform = new DOMMatrixReadOnly(getComputedStyle(node).transform);
              return [
                node.dataset.id,
                { x: transform.e, y: transform.f, opacity: Number(getComputedStyle(node).opacity) },
              ];
            }),
          );
          frames.push({
            x: box.x + box.width / 2,
            y: box.y + box.height / 2,
            zoom: matrix.a,
            connected: element.isConnected,
            edgeError,
            edgeCount,
            edgeIssue,
            positions,
          });
          const signature = JSON.stringify({ positions, viewport: viewport.style.transform });
          const now = performance.now();
          if (signature !== previous) {
            previous = signature;
            changed = now;
          }
          const selected = element.querySelector("button").getAttribute("aria-pressed") === "true";
          if (
            now - started < 5000 &&
            (now - started < 650 || now - changed < 200 || selected !== (action === "select"))
          )
            requestAnimationFrame(frame);
          else resolve(frames);
        }
        frame();
      }),
    { id, action },
  );
}

for (const width of [1440, 390]) {
  for (const path of ["/", roadmap]) {
    for (const reducedMotion of ["no-preference", "reduce"]) {
      test(`${path === "/" ? "curriculum" : "roadmap"} focus continuity, ${width}px, ${reducedMotion}`, async ({
        page,
        context,
      }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.emulateMedia({ reducedMotion });
        await context.addCookies([
          { name: "g13-language", value: "id", url: "http://127.0.0.1:4173" },
        ]);
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(path);
        await page.waitForFunction(
          () => document.querySelector('button[aria-label="Pengaturan"]')?.disabled === false,
        );
        await page.getByRole("button", { name: "Semester 1", exact: true }).click();
        await settled(page);
        const id = await page.locator("[data-course]").evaluateAll((courses) => {
          const visible = courses.filter((course) => {
            const box = course.getBoundingClientRect();
            return (
              box.x > 0 &&
              box.x + box.width < innerWidth &&
              box.y > 200 &&
              box.bottom < innerHeight - 150
            );
          });
          return (
            visible.find((course) => course.querySelector(".react-flow__handle")) ?? visible[0]
          ).dataset.course;
        });
        const entering = await sample(page, id, "select");
        expect(entering.every((frame) => frame.connected)).toBe(true);
        const end = entering.at(-1);
        const graph = await page.locator(".react-flow").boundingBox();
        const left = width < 650 ? 16 : 424;
        const top = width < 650 ? 128 : 96;
        expect(end.x).toBeCloseTo(left + (width - left - 16) / 2, 0);
        expect(end.y).toBeCloseTo(
          graph.y + top + (graph.height - top - 24 - (width < 650 ? 300 : 0)) / 2,
          0,
        );
        if (reducedMotion === "no-preference") {
          const start = entering[0];
          expect(
            entering.some(
              (frame) =>
                Math.hypot(frame.x - start.x, frame.y - start.y) > 2 &&
                Math.hypot(frame.x - end.x, frame.y - end.y) > 2,
            ),
          ).toBe(true);
        }
        for (const frame of entering)
          expect(frame.edgeError, JSON.stringify(frame.edgeIssue)).toBeLessThan(3);
        expect(entering.some((frame) => frame.edgeCount > 0)).toBe(true);
        const closing = await sample(page, id, "close");
        for (const frame of closing) {
          expect(frame.connected).toBe(true);
          expect(frame.edgeError, JSON.stringify(frame.edgeIssue)).toBeLessThan(3);
          expect(Math.abs(frame.x - end.x)).toBeLessThan(1);
          expect(Math.abs(frame.y - end.y)).toBeLessThan(1);
          expect(Math.abs(frame.zoom - end.zoom)).toBeLessThan(0.001);
        }
        await expect(page.getByRole("dialog")).toHaveCount(0);
        expect(await page.locator("[data-course]").count()).toBeGreaterThan(10);
        if (reducedMotion === "no-preference") {
          expect(
            closing.some((frame) =>
              Object.values(frame.positions).some(
                (node) => node.opacity > 0.05 && node.opacity < 0.95,
              ),
            ),
          ).toBe(true);
          const moved = Object.keys(entering[0].positions).some((nodeId) => {
            const from = entering[0].positions[nodeId];
            const to = end.positions[nodeId];
            if (!to || Math.hypot(from.x - to.x, from.y - to.y) < 2) return false;
            return entering.some((frame) => {
              const point = frame.positions[nodeId];
              return (
                point &&
                Math.hypot(point.x - from.x, point.y - from.y) > 1 &&
                Math.hypot(point.x - to.x, point.y - to.y) > 1
              );
            });
          });
          expect(moved).toBe(true);
        }
        const isolated = await sample(page, "PAKF262101", "select");
        await expect(page.locator(".react-flow__node-course")).toHaveCount(1);
        expect(isolated.at(-1).x).toBeCloseTo(left + (width - left - 16) / 2, 0);
        const isolatedClose = await sample(page, "PAKF262101", "close");
        for (const frame of isolatedClose) {
          expect(Math.abs(frame.x - isolated.at(-1).x)).toBeLessThan(1);
          expect(Math.abs(frame.y - isolated.at(-1).y)).toBeLessThan(1);
          expect(Math.abs(frame.zoom - isolated.at(-1).zoom)).toBeLessThan(0.001);
        }
        expect(errors).toEqual([]);
      });
    }
  }
}

for (const width of [1440, 390]) {
  for (const path of ["/", roadmap]) {
    test(`${path === "/" ? "curriculum" : "roadmap"} redirects motion and preserves a manually adjusted focus, ${width}px`, async ({
      page,
      context,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await context.addCookies([
        { name: "g13-language", value: "id", url: "http://127.0.0.1:4173" },
      ]);
      await page.goto(path);
      await page.locator("[data-course-button]").first().waitFor();
      await page.getByRole("button", { name: "Semester 1", exact: true }).click();
      await settled(page);
      const { source, target } = await page
        .locator(".react-flow__edge")
        .first()
        .evaluate((edge) => {
          const [source, target] = edge.dataset.id.split("->");
          return { source, target };
        });
      const interrupted = await page.evaluate(
        async ({ source, target }) => {
          const button = (id) => document.querySelector(`[data-course="${id}"] button`);
          const position = (id) => {
            const node = button(id).closest(".react-flow__node");
            const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
            const box = node.getBoundingClientRect();
            return { x: matrix.e, y: matrix.f, screenX: box.x, screenY: box.y };
          };
          const pause = () => new Promise((resolve) => setTimeout(resolve, 90));
          button(source).click();
          await pause();
          const before = position(target);
          button(target).click();
          await pause();
          const after = position(target);
          const anchor = position(target);
          document.querySelector('button[aria-label="Tutup detail mata kuliah"]').click();
          await pause();
          const closing = position(target);
          button(source).click();
          return { before, after, anchor, closing };
        },
        { source, target },
      );
      expect(Math.abs(interrupted.before.x - interrupted.after.x)).toBeLessThan(1);
      expect(Math.abs(interrupted.before.y - interrupted.after.y)).toBeLessThan(1);
      expect(Math.abs(interrupted.anchor.screenX - interrupted.closing.screenX)).toBeLessThan(1);
      expect(Math.abs(interrupted.anchor.screenY - interrupted.closing.screenY)).toBeLessThan(1);
      await settled(page);
      await expect(page.locator(`[data-course="${source}"] button`)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(page.locator('[data-course-button][aria-pressed="true"]')).toHaveCount(1);
      const focusedZoom = await page
        .locator(".react-flow__viewport")
        .evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a);
      await page.mouse.move(width - 25, 260);
      await page.mouse.down();
      await page.mouse.move(width - 55, 230, { steps: 5 });
      await page.mouse.up();
      await page.keyboard.down("Control");
      await page.mouse.wheel(0, -150);
      await page.keyboard.up("Control");
      await settled(page);
      const frames = await sample(page, source, "close");
      expect(frames[0].zoom).not.toBeCloseTo(focusedZoom, 2);
      for (const frame of frames) {
        expect(Math.abs(frame.x - frames[0].x)).toBeLessThan(1);
        expect(Math.abs(frame.y - frames[0].y)).toBeLessThan(1);
        expect(Math.abs(frame.zoom - frames[0].zoom)).toBeLessThan(0.001);
      }
      await expect(page.getByRole("dialog")).toHaveCount(0);
    });
  }
}
