import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { z } from "zod";

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;
const rowLimit = 10_000;
const api = "https://api.cloudflare.com/client/v4/analytics/sql";
const common = {
  timestamp: z.iso.datetime({ offset: true }),
  requestId: z.string().nullish(),
  method: z.string(),
  path: z.string(),
};
const logRow = z.discriminatedUnion("event", [
  z.object({
    ...common,
    event: z.literal("server_error"),
    errorName: z.string(),
    message: z.string(),
    stack: z.string(),
  }),
  z.object({
    ...common,
    event: z.literal("server_response"),
    status: z.coerce.number().int().min(500).max(599),
  }),
]);
type LogRow = z.infer<typeof logRow>;
type ErrorRow = Extract<LogRow, { event: "server_error" }>;
const stateSchema = z.object({
  cursor: z.number().int().nonnegative(),
  fingerprints: z.record(z.string().regex(/^[a-f0-9]{16}$/), z.number().int().nonnegative()),
  disabled: z.array(z.string().regex(/^[a-f0-9]{16}$/)).default([]),
  fixSessions: z.array(z.number().int().nonnegative()),
  consecutiveFailures: z.number().int().nonnegative(),
});
type State = z.infer<typeof stateSchema>;
type Incident = {
  request: LogRow;
  error?: ErrorRow;
  status: number;
  count: number;
  first: number;
  last: number;
};

function fingerprint(incident: Incident): string {
  const { request, error, status } = incident;
  const frames = error?.stack
    .split("\n")
    .filter((line) => /^\s*at\s/.test(line))
    .slice(0, 3)
    .map((line) => line.trim().replace(/:\d+:\d+(?=\)?$)/, ""));
  const key = error ? [error.errorName, frames] : [status];
  return createHash("sha256")
    .update(JSON.stringify([request.method, request.path, key]))
    .digest("hex")
    .slice(0, 16);
}

function groupIncidents(rows: LogRow[]) {
  const requests = new Map<string, Incident>();
  const incidents = new Map<string, Incident>();
  for (const [index, row] of rows.entries()) {
    const key = row.requestId ? `request:${row.requestId}` : `row:${index}`;
    const timestamp = Date.parse(row.timestamp);
    const incident = requests.get(key) ?? {
      request: row,
      status: 500,
      count: 1,
      first: timestamp,
      last: timestamp,
    };
    if (row.event === "server_error") incident.error ??= row;
    else incident.status = row.status;
    incident.first = Math.min(incident.first, timestamp);
    incident.last = Math.max(incident.last, timestamp);
    requests.set(key, incident);
  }
  for (const incident of requests.values()) {
    const key = fingerprint(incident);
    const existing = incidents.get(key);
    if (!existing) {
      incidents.set(key, incident);
      continue;
    }
    existing.count += 1;
    existing.first = Math.min(existing.first, incident.first);
    existing.last = Math.max(existing.last, incident.last);
  }
  return [...incidents].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));
}

function iso(timestamp: number) {
  return new Date(timestamp).toISOString();
}

function diagnostic(value: string, limit: number) {
  return value.slice(0, limit).replaceAll("~~~", "∼∼∼").replaceAll("@", "＠");
}

export function buildIncidentReport(rows: LogRow[], state: State, now: number, dashboard: string) {
  const eligible = groupIncidents(rows).filter(
    ([key]) => !state.disabled.includes(key) && (state.fingerprints[key] ?? -Infinity) <= now - day,
  );
  const sessions = state.fixSessions.filter((timestamp) => timestamp > now - day);
  const fingerprints = Object.fromEntries(
    Object.entries(state.fingerprints).filter(([, timestamp]) => timestamp > now - day),
  );
  const next = {
    ...state,
    cursor: Math.max(state.cursor, now),
    fingerprints,
    fixSessions: sessions,
    consecutiveFailures: 0,
  };
  if (!eligible.length) return { state: next, report: null };

  const reportOnly =
    sessions.length >= 10 || sessions.filter((timestamp) => timestamp > now - hour).length >= 3;
  if (!reportOnly) sessions.push(now);
  const sections = eligible.slice(0, 5).map(([key, incident]) => {
    fingerprints[key] = now;
    const { request, error, status, count, first, last } = incident;
    return [
      `## Incident ${key}`,
      "~~~text",
      `${diagnostic(request.method, 64)} ${diagnostic(request.path, 512)} → ${status}`,
      `Error type: ${diagnostic(error?.errorName ?? "HTTP response", 128)}`,
      `Occurrences: ${count}`,
      `First seen: ${iso(first)}`,
      `Last seen: ${iso(last)}`,
      diagnostic(error?.message ?? "", 2_048),
      diagnostic(error?.stack ?? "", 8_192),
      "~~~",
    ].join("\n");
  });
  const omitted = eligible.length - sections.length;
  return {
    state: next,
    report: [
      "# Production 5xx incidents",
      `reportOnly: ${reportOnly}`,
      `[Cloudflare Workers Logs](${dashboard})`,
      ...sections,
      ...(omitted ? [`${omitted} additional incidents omitted (limit: five).`] : []),
    ].join("\n\n"),
  };
}

async function queryLogs(
  accountTag: string,
  token: string,
  worker: string,
  start: number,
  end: number,
) {
  const response = await fetch(api, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      query: `SELECT timestamp, attributes['event'] AS event,
        attributes['requestId'] AS requestId, attributes['method'] AS method,
        attributes['path'] AS path, attributes['status'] AS status,
        attributes['errorName'] AS errorName, attributes['message'] AS message,
        attributes['stack'] AS stack
        FROM logs.workersLogs
        WHERE scriptName = $worker
          AND (attributes['event'] = 'server_error' OR attributes['event'] = 'server_response')
        ORDER BY timestamp ASC LIMIT ${rowLimit}`,
      scope: { accountTag },
      params: { worker },
      time_range: { start: iso(start), end: iso(end) },
    }),
  });
  if (!response.ok) throw new Error("Cloudflare query failed");
  const { data } = z.object({ data: z.array(logRow) }).parse(await response.json());
  if (data.length >= rowLimit) throw new Error("Cloudflare query reached the row limit");
  return data;
}

function initialState(now: number): State {
  return { cursor: now, fingerprints: {}, disabled: [], fixSessions: [], consecutiveFailures: 0 };
}

async function loadState(path: string, now: number): Promise<State> {
  try {
    return stateSchema.parse(JSON.parse(await readFile(path, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return initialState(now);
  }
}

async function saveState(path: string, state: State) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(state, null, 2) + "\n", { mode: 0o600, flag: "wx" });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

export async function poll(
  state: State,
  now: number,
  dashboard: string,
  load: () => Promise<LogRow[]>,
) {
  let rows: LogRow[];
  try {
    rows = await load();
  } catch {
    const consecutiveFailures = state.consecutiveFailures + 1;
    const report =
      consecutiveFailures === 3
        ? "# monitoring_degraded\n\nreportOnly: true\n\nThree consecutive Workers Logs queries failed."
        : null;
    return { state: { ...state, consecutiveFailures }, report };
  }
  return buildIncidentReport(rows, state, now, dashboard);
}

async function main() {
  const [flag, fixture] = process.argv.slice(2);
  if (flag && (flag !== "--fixture" || !fixture || process.argv.length !== 4)) {
    throw new Error("Invalid arguments");
  }
  const now = Date.now();
  const account = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
  const token = process.env.CLOUDFLARE_API_TOKEN ?? "";
  const worker = process.env.G13_ERROR_REPORT_WORKER ?? "g-13";
  if (worker !== "g-13" && worker !== "g-13-staging") throw new Error("Invalid Worker");
  const stateFile = worker === "g-13" ? "error-report.json" : "error-report-staging.json";
  const defaultState = join(homedir(), ".local", "state", "g13", stateFile);
  const statePath = resolve(process.env.G13_ERROR_REPORT_STATE ?? defaultState);
  const state = fixture ? initialState(now) : await loadState(statePath, now);
  const dashboard = fixture
    ? "https://dash.cloudflare.com/"
    : `https://dash.cloudflare.com/${account}/workers/services/view/${worker}/production/observability`;
  if (!fixture && (!/^[a-f0-9]{32}$/.test(account) || !token)) {
    throw new Error("Cloudflare credentials are missing or invalid");
  }
  const result = fixture
    ? buildIncidentReport(
        z.array(logRow).parse(JSON.parse(await readFile(fixture, "utf8"))),
        state,
        now,
        dashboard,
      )
    : await poll(state, now, dashboard, () =>
        queryLogs(account, token, worker, state.cursor - 5 * minute, now),
      );
  if (!fixture) await saveState(statePath, result.state);
  if (result.report)
    console.log(token ? result.report.replaceAll(token, "[redacted]") : result.report);
  return result.report ? 0 : 1;
}

if (import.meta.main) {
  try {
    process.exitCode = await main();
  } catch {
    console.error("Error reporting could not run. Check configuration and state file access.");
    process.exitCode = 1;
  }
}
