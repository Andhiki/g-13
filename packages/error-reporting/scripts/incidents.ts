import { createHash } from "node:crypto";
import { MAX_MESSAGE_LENGTH, MAX_STACK_LENGTH } from "../src/events";
import type { LogRow } from "./rows";
import type { State } from "./state";

const hour = 3_600_000;
const day = 24 * hour;
type ErrorRow = Extract<LogRow, { event: "server_error" }>;
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

export function buildIncidentReport(
  rows: LogRow[],
  state: State,
  now: number,
  dashboard: string | undefined,
  allowDraftFixes = true,
) {
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
  if (!eligible.length) return { state: next, report: null, reportOnly: true };

  const reportOnly =
    !allowDraftFixes ||
    sessions.length >= 10 ||
    sessions.filter((timestamp) => timestamp > now - hour).length >= 3;
  if (!reportOnly) sessions.push(now);
  const sections = eligible.slice(0, 5).map(([key, incident]) => {
    fingerprints[key] = now;
    const { request, error, status, count, first, last } = incident;
    return [
      `### Incident ${key}`,
      "~~~text",
      `${diagnostic(request.method, 64)} ${diagnostic(request.path, 512)} → ${status}`,
      `Error type: ${diagnostic(error?.errorName ?? "HTTP response", 128)}`,
      `Occurrences: ${count}`,
      `First seen: ${iso(first)}`,
      `Last seen: ${iso(last)}`,
      diagnostic(error?.message ?? "", MAX_MESSAGE_LENGTH),
      diagnostic(error?.stack ?? "", MAX_STACK_LENGTH),
      "~~~",
    ].join("\n");
  });
  const omitted = eligible.length - sections.length;
  return {
    state: next,
    reportOnly,
    report: [
      `reportOnly: ${reportOnly}`,
      ...(dashboard ? [`[Source logs](${dashboard})`] : []),
      ...sections,
      ...(omitted ? [`${omitted} additional incidents omitted (limit: five).`] : []),
    ].join("\n\n"),
  };
}
