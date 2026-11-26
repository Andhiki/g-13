import { randomBytes } from "node:crypto";
import type { E2EConfig } from "e2e";
import { browserEngine, runSettings } from "./config.ts";

export function localConfig(tests: string[], output: string, targetName = "local-sqlite") {
  // Workers inherit the runner's values when they load this config again.
  const env = {
    E2E_FIXTURE_TOKEN: (process.env.E2E_FIXTURE_TOKEN ??= randomBytes(32).toString("hex")),
    E2E_AUTH_SECRET: (process.env.E2E_AUTH_SECRET ??= randomBytes(32).toString("hex")),
    E2E_REVIEW_RATE_LIMIT_SECRET: (process.env.E2E_REVIEW_RATE_LIMIT_SECRET ??=
      randomBytes(32).toString("hex")),
  };

  return {
    ...runSettings,
    tests,
    output,
    targets: [
      {
        name: targetName,
        engine: browserEngine(),
        app: {
          url: "http://127.0.0.1:0",
          identity: "g-13-local-worker",
          readyUrl: "http://127.0.0.1:{port}/api/alumni",
          command: {
            executable: process.execPath,
            args: ["e2e/serve-local.ts", "{port}"],
            env,
            startupTimeout: 120_000,
            shutdownTimeout: 15_000,
            log: `${output}/worker.log`,
          },
        },
      },
    ],
  } satisfies E2EConfig;
}
