import { web } from "@e2e-dev/web";
import type { E2EConfig } from "e2e";
import { isolatedOrigin, sharedOrigin } from "./e2e/targets.ts";

const smoke = process.env.E2E_MODE === "smoke";

export default {
  tests: smoke
    ? ["e2e/shared/**/*.e2e.ts"]
    : ["e2e/isolated/**/*.e2e.ts", "e2e/public/**/*.e2e.ts"],
  targets: [
    {
      name: smoke ? "shared-staging" : "isolated-staging",
      engine: web({ browser: "chromium", viewport: { width: 1440, height: 900 }, locale: "id-ID" }),
      app: { url: smoke ? sharedOrigin : isolatedOrigin },
    },
  ],
  workers: 1,
  timeout: 45_000,
  trace: "retain-on-failure",
  reporters: ["list", "markdown", "junit"],
} satisfies E2EConfig;
