import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("A first-time student can create and share a 2026 seven-semester roadmap", async ({
  app,
  agent,
  browser,
  screen,
}) => {
  await browser.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("Clipboard unavailable")) },
    });
  });
  await app.open("/roadmap");

  await agent.act(
    "Create a 2026 roadmap for a regular student interested in Data Analysis (Analisis Data) who will not do an internship. Set the target to seven semesters and open the share dialog.",
    { maxSteps: 20, maxModelCalls: 20, timeout: 90_000 },
  );

  const sharedLink = screen.getByLabel(/tautan roadmap|roadmap link/i);
  await expect(sharedLink).toBeVisible();
  const link = new URL(await sharedLink.inputValue());
  expect(link.origin).toBe(app.baseUrl);
  expect(link.pathname).toBe("/roadmap");
  expect(link.searchParams.get("kurikulum")).toBe('"2026"');
  expect(link.searchParams.get("minat")).toBe("Analisis Data");
  expect(link.searchParams.get("iup")).toBe("tidak");
  expect(link.searchParams.get("magang")).toBe("tidak");
  expect(link.searchParams.get("lulus")).toBe("7");

  await app.clearState();
  await app.open(link.href);
  await expect(screen.getByRole("button", { name: /^bagikan$|^share$/i })).toBeVisible();
  await expect(screen.getByText(/(?:semester 7|7 semester)/i).first()).toBeVisible();
});
