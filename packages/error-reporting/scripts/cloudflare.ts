import type { LogSource } from "./runner";

const rowLimit = 10_000;
const api = "https://api.cloudflare.com/client/v4/analytics/sql";

export function cloudflareLogs(worker: string): LogSource {
  const accountTag = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
  const token = process.env.CLOUDFLARE_API_TOKEN ?? "";
  return {
    dashboard: /^[a-f0-9]{32}$/.test(accountTag)
      ? `https://dash.cloudflare.com/${accountTag}/workers/services/view/${encodeURIComponent(worker)}/production/observability`
      : undefined,
    async read(start, end) {
      if (!/^[a-f0-9]{32}$/.test(accountTag) || !token) {
        throw new Error("Cloudflare credentials are missing or invalid");
      }
      const response = await fetch(api, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          query: `SELECT timestamp, attributes['event'] AS event,
        attributes['schemaVersion'] AS schemaVersion,
        attributes['service'] AS service, attributes['environment'] AS environment,
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
          time_range: { start: new Date(start).toISOString(), end: new Date(end).toISOString() },
        }),
      });
      if (!response.ok) throw new Error("Cloudflare query failed");
      const body = (await response.json()) as { data?: unknown };
      const { data } = body;
      if (!Array.isArray(data)) throw new Error("Cloudflare query returned invalid rows");
      if (data.length >= rowLimit) throw new Error("Cloudflare query reached the row limit");
      return data;
    },
  };
}
