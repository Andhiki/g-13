import { gateway } from "ai";
import type { E2EConfig } from "e2e";
import { localConfig } from "./e2e/local-config.ts";

export default {
  ...localConfig(["e2e/agent/**/*.e2e.ts"], ".e2e/agent", "local-roadmap-agent"),
  agents: {
    default: {
      model: gateway(process.env.E2E_AGENT_MODEL ?? "openai/gpt-6-luna-fast"),
    },
  },
  cache: { mode: "read-write", dir: ".e2e/cache" },
  retries: 0,
  timeout: 120_000,
} satisfies E2EConfig;
