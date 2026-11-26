import { homedir } from "node:os";
import { join } from "node:path";
import { cloudflareLogs } from "./cloudflare";
import type { MonitoredService } from "./runner";

export function monitoredServices(): MonitoredService[] {
  const worker = process.env.G13_ERROR_REPORT_WORKER ?? "g-13";
  if (worker !== "g-13" && worker !== "g-13-staging") throw new Error("Invalid Worker");
  const production = worker === "g-13";
  const identity = { service: "g-13", environment: production ? "production" : "staging" };
  const stateFile = production ? "error-report.json" : "error-report-staging.json";
  return [
    {
      ...identity,
      source: cloudflareLogs(worker),
      statePath:
        process.env.G13_ERROR_REPORT_STATE ?? join(homedir(), ".local", "state", "g13", stateFile),
      draftFix: { repository: "Andhiki/g-13", baseBranch: "staging" },
    },
  ];
}
