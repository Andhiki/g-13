import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildIncidentReport, poll } from "./report-server-errors";

const now = Date.parse("2026-11-25T10:00:00Z");
const hour = 3_600_000;
const dashboard = "https://dash.cloudflare.com/";
const state = {
  cursor: now - 600_000,
  fingerprints: {},
  disabled: [],
  fixSessions: [],
  consecutiveFailures: 0,
};
const response = {
  event: "server_response" as const,
  requestId: "one",
  timestamp: new Date(now - 2000).toISOString(),
  method: "GET",
  path: "/dashboard",
  status: 503,
};
const failure = {
  ...response,
  event: "server_error" as const,
  errorName: "TypeError",
  message: "synthetic failure",
  stack: "TypeError: synthetic failure\n    at load (src/example.ts:12:34)",
};

test("joins a request's error and response and fingerprints recurring stack frames", () => {
  const result = buildIncidentReport(
    [
      failure,
      response,
      { ...failure, requestId: "two", stack: failure.stack.replace(":12:34", ":89:3") },
    ],
    state,
    now,
    dashboard,
  );
  expect(result.report?.match(/## Incident/g)).toHaveLength(1);
  expect(result.report).toContain("Occurrences: 2");
  expect(result.report).toContain("GET /dashboard → 503");
  expect(result.report).toContain("TypeError");
  expect(result.state.cursor).toBe(now);
});

test("suppresses repeats for 24 hours and supports disabling a fingerprint", () => {
  const first = buildIncidentReport([response], state, now, dashboard);
  expect(buildIncidentReport([response], first.state, now + hour, dashboard).report).toBeNull();
  expect(
    buildIncidentReport([response], first.state, now + 24 * hour, dashboard).report,
  ).toBeTruthy();
  const disabled = Object.keys(first.state.fingerprints);
  expect(buildIncidentReport([response], { ...state, disabled }, now, dashboard).report).toBeNull();
});

test("caps reports at five and respects each rolling fix budget", () => {
  const rows = Array.from({ length: 6 }, (_, i) => ({
    ...response,
    requestId: String(i),
    path: `/route-${i}`,
  }));
  for (const fixSessions of [Array(3).fill(now - 1), Array(10).fill(now - 2 * hour)]) {
    const result = buildIncidentReport(rows, { ...state, fixSessions }, now, dashboard);
    expect(result.report).toContain("reportOnly: true");
    expect(result.report).toContain("1 additional incidents omitted");
    expect(result.report?.match(/## Incident/g)).toHaveLength(5);
    expect(Object.keys(result.state.fingerprints)).toHaveLength(5);
    expect(result.state.fixSessions).toEqual(fixSessions);
  }
});

test("reports the third consecutive failure without advancing the cursor", async () => {
  const load = async () => {
    throw new Error("secret");
  };
  const first = await poll(state, now, dashboard, load);
  const second = await poll(first.state, now, dashboard, load);
  const third = await poll(second.state, now, dashboard, load);
  expect(first.report).toBeNull();
  expect(second.report).toBeNull();
  expect(third.report).toContain("monitoring_degraded");
  expect(third.report).not.toContain("secret");
  expect(third.state.cursor).toBe(state.cursor);
  const success = await poll(third.state, now, dashboard, async () => []);
  expect(success.state.cursor).toBe(now);
  expect(success.state.consecutiveFailures).toBe(0);
});

test("fixture CLI exits 0 with a report and 1 with an empty fixture", async () => {
  const directory = await mkdtemp(join(tmpdir(), "g13-report-test-"));
  const fixture = join(directory, "events.json");
  const script = join(import.meta.dir, "report-server-errors.ts");
  try {
    for (const rows of [[response], []]) {
      await writeFile(fixture, JSON.stringify(rows));
      const child = Bun.spawn([process.execPath, script, "--fixture", fixture], { stdout: "pipe" });
      const stdout = await new Response(child.stdout).text();
      expect(await child.exited).toBe(rows.length ? 0 : 1);
      expect(stdout.includes("## Incident")).toBe(Boolean(rows.length));
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
