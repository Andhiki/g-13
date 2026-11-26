import type { LogSource } from "./runner";

const rowLimit = 10_000;
const api = "https://api.cloudflare.com/client/v4/analytics/sql";

export function cloudflareLogs(worker: string): LogSource {
  const accountTag = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
  const token = process.env.CLOUDFLARE_API_TOKEN ?? "";
  async function readWindow(start: number, end: number, signal: AbortSignal): Promise<unknown[]> {
    const response = await fetch(api, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      signal,
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
    // Adjacent windows share a boundary. Discard the upper bound if the API includes it.
    if (data.length < rowLimit) {
      return data.filter((row) => Date.parse(row?.timestamp) !== end);
    }
    if (end - start <= 1)
      throw new Error("Cloudflare query reached the row limit in one millisecond");

    const midpoint = start + Math.floor((end - start) / 2);
    const earlier = await readWindow(start, midpoint, signal);
    const later = await readWindow(midpoint, end, signal);
    return earlier.concat(later);
  }

  return {
    dashboard: /^[a-f0-9]{32}$/.test(accountTag)
      ? `https://dash.cloudflare.com/${accountTag}/workers/services/view/${encodeURIComponent(worker)}/production/observability`
      : undefined,
    async read(start, end) {
      if (!/^[a-f0-9]{32}$/.test(accountTag) || !token) {
        throw new Error("Cloudflare credentials are missing or invalid");
      }
      return readWindow(start, end, AbortSignal.timeout(30_000));
    },
  };
}
