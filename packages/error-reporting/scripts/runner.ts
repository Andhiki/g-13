import { resolve } from "node:path";
import { buildIncidentReport } from "./incidents";
import { parseLogRows, type LogRow, type ServiceIdentity } from "./rows";
import { loadState, saveState, type State } from "./state";

export type LogSource = {
  dashboard?: string;
  read: (start: number, end: number) => Promise<readonly unknown[]>;
};

export type MonitoredService = ServiceIdentity & {
  source: LogSource;
  statePath: string;
  draftFix?: { repository: string; baseBranch: string };
};

export async function poll(
  state: State,
  now: number,
  dashboard: string | undefined,
  load: () => Promise<LogRow[]>,
  allowDraftFixes = true,
) {
  let rows: LogRow[];
  try {
    rows = await load();
  } catch {
    const consecutiveFailures = state.consecutiveFailures + 1;
    const report =
      consecutiveFailures === 3
        ? "monitoring_degraded\n\nreportOnly: true\n\nThree consecutive log source queries failed."
        : null;
    return { state: { ...state, consecutiveFailures }, report, reportOnly: true };
  }
  return buildIncidentReport(rows, state, now, dashboard, allowDraftFixes);
}

export async function reportIncidents(
  services: MonitoredService[],
  now: number,
): Promise<string | null> {
  const identities = new Set<string>();
  const paths = new Set<string>();
  for (const { service, environment, statePath } of services) {
    const identity = `${service}/${environment}`;
    const path = resolve(statePath);
    if (identities.has(identity) || paths.has(path)) {
      throw new Error("Each monitored service must have a unique identity and state path");
    }
    identities.add(identity);
    paths.add(path);
  }
  const reports = await Promise.all(
    services.map(async (service) => {
      const { source, statePath, draftFix } = service;
      const heading = `## ${service.service} (${service.environment})`;
      try {
        const state = await loadState(statePath, now);
        const result = await poll(
          state,
          now,
          source.dashboard,
          async () =>
            parseLogRows(
              await source.read(state.cursor - 300_000, Math.max(now, state.cursor)),
              service,
            ),
          Boolean(draftFix),
        );
        await saveState(statePath, result.state);
        if (!result.report) return null;
        const target =
          draftFix && !result.reportOnly
            ? `Draft fix target: ${draftFix.repository} → ${draftFix.baseBranch}\n\n`
            : "";
        return `${heading}\n\n${target}${result.report}`;
      } catch {
        return `${heading}\n\nmonitoring_degraded\n\nreportOnly: true\n\nCould not read or write incident state.`;
      }
    }),
  );
  const sections = reports.filter((report) => report !== null);
  return sections.length ? ["# 5xx incidents", ...sections].join("\n\n") : null;
}
