import type { E2EConfig } from "e2e";
import { browserEngine, runSettings } from "./e2e/config.ts";

export default {
  ...runSettings,
  tests: ["e2e/smoke/**/*.e2e.ts"],
  output: ".e2e/smoke",
  targets: [
    {
      name: "shared-staging",
      engine: browserEngine(),
      app: { url: "https://g-13-staging.andhikiandre.workers.dev", environment: "staging" },
    },
  ],
} satisfies E2EConfig;
