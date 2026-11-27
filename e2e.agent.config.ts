import type { E2EConfig, StepExecutor } from "e2e";
import { chatgpt } from "e2e/oauth/chatgpt";
import { localConfig } from "./e2e/local-config.ts";

const ci = process.env.CI === "true" || process.env.CI === "1";
const replayOnly: StepExecutor = {
  name: "replay-only",
  async runStep() {
    return {
      status: "blocked",
      errorCode: "AUTOMATION_UNSUPPORTED",
      summary: "No usable E2E replay. Record the scenario locally and commit the updated cache.",
    };
  },
};

export default {
  ...localConfig(["e2e/agent/**/*.e2e.ts"], ".e2e/agent", "local-roadmap-agent"),
  projectId: "g-13-e2e-agent",
  agents: {
    default: ci
      ? { executor: replayOnly }
      : { model: chatgpt(process.env.E2E_AGENT_MODEL ?? "gpt-6-luna") },
  },
  cache: { mode: ci ? "read-only" : "read-write", dir: "e2e/cache", strict: ci },
  retries: 0,
  timeout: 120_000,
} satisfies E2EConfig;
