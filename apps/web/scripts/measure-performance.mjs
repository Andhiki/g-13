import { chromium } from "playwright";

const ports = process.argv.slice(2).map(Number);
if (
  ports.length !== 2 ||
  ports.some((port) => !Number.isInteger(port) || port < 1 || port > 65535)
) {
  throw new Error(
    "Usage: node apps/web/scripts/measure-performance.mjs <baseline-port> <optimized-port>",
  );
}
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [390, 1440]) {
    for (let run = 0; run < 5; run++) {
      for (const port of ports) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: "no-preference",
        });
        const page = await context.newPage();
        page.setDefaultTimeout(30000);
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("requestfailed", (request) => errors.push(request.failure()?.errorText));
        page.on("response", (response) => {
          if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
        });
        const session = await context.newCDPSession(page);
        await session.send("Network.enable");
        await session.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 150,
          downloadThroughput: 200 * 1024,
          uploadThroughput: 100 * 1024,
        });
        await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        await session.send("Performance.enable");
        await page.addInitScript(() => {
          new PerformanceObserver((list) => {
            window.lcp = list.getEntries().at(-1).startTime;
          }).observe({ type: "largest-contentful-paint", buffered: true });
        });
        await page.goto(`http://[::1]:${port}/?kurikulum=2026`);
        await page.waitForFunction(
          () =>
            document.querySelector('[data-id="PACS262201"] button') &&
            document.querySelector('button[aria-keyshortcuts="D"]:not(:disabled)'),
        );
        const ready = await page.evaluate(() => performance.now());
        await page.waitForTimeout(1500);
        const startup = await page.evaluate(() => ({
          lcp: window.lcp,
          jsDecoded: performance
            .getEntriesByType("resource")
            .filter((r) => r.name.endsWith(".js"))
            .reduce((n, r) => n + r.decodedBodySize, 0),
          jsEncoded: performance
            .getEntriesByType("resource")
            .filter((r) => r.name.endsWith(".js"))
            .reduce((n, r) => n + r.encodedBodySize, 0),
        }));
        const select = () =>
          page.locator('[data-id="PACS262201"] button').evaluate((button) => button.click());
        await select();
        await page.getByRole("dialog").waitFor();
        await page.waitForTimeout(2000);
        await page.keyboard.press("Escape");
        await page.getByRole("dialog").waitFor({ state: "hidden" });
        await page.waitForTimeout(1500);
        const before = await session.send("Performance.getMetrics");
        await select();
        await page.getByRole("dialog").waitFor();
        await page.waitForTimeout(2000);
        const after = await session.send("Performance.getMetrics");
        const task = (metrics) =>
          metrics.metrics.find((metric) => metric.name === "TaskDuration").value;
        const interactionCpu = (task(after) - task(before)) * 1000;
        if ((await page.locator(".react-flow__edge-path").count()) === 0)
          throw new Error("Selection did not render prerequisite edges");
        if (errors.length) throw new Error(JSON.stringify(errors));
        const result = { port, width, run, ready, ...startup, interactionCpu, errors };
        results.push(result);
        console.error(JSON.stringify(result));
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
