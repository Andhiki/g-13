import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: "http://[::1]:5180",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    {
      name: "mobile",
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: "bun run build && bun run preview --host ::1 --port 5180 --strictPort",
    url: "http://[::1]:5180",
    reuseExistingServer: !process.env.CI,
  },
});
