import { web } from "@e2e-dev/web";
import type { E2EConfig } from "e2e";

export const browserEngine = () =>
  web({ browser: "chromium", viewport: { width: 1440, height: 900 }, locale: "id-ID" });

export const runSettings = {
  workers: 1,
  timeout: 45_000,
  trace: "retain-on-failure",
  reporters: ["list", "markdown", "junit"],
} satisfies Partial<E2EConfig>;
