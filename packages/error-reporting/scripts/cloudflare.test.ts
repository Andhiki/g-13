import { expect, spyOn, test } from "bun:test";
import { cloudflareLogs } from "./cloudflare";

test("splits a full log window and counts the boundary in only one batch", async () => {
  const timestamp = (ms: number) => new Date(ms).toISOString();
  const boundaryRow = { timestamp: timestamp(5) };
  const requests: { start: string; end: string }[] = [];
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  process.env.CLOUDFLARE_ACCOUNT_ID = "a".repeat(32);
  process.env.CLOUDFLARE_API_TOKEN = "synthetic";
  const source = cloudflareLogs("example-worker");
  if (account === undefined) delete process.env.CLOUDFLARE_ACCOUNT_ID;
  else process.env.CLOUDFLARE_ACCOUNT_ID = account;
  if (token === undefined) delete process.env.CLOUDFLARE_API_TOKEN;
  else process.env.CLOUDFLARE_API_TOKEN = token;
  const fetchLogs = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(
      async (_url: RequestInfo | URL, init?: RequestInit) => {
        const { time_range: window } = JSON.parse(String(init?.body));
        requests.push(window);
        return Response.json({
          data: requests.length === 1 ? Array(10_000).fill(boundaryRow) : [boundaryRow],
        });
      },
      { preconnect: fetch.preconnect },
    ),
  );
  try {
    expect(await source.read(0, 10)).toEqual([boundaryRow]);
    expect(requests).toEqual([
      { start: timestamp(0), end: timestamp(10) },
      { start: timestamp(0), end: timestamp(5) },
      { start: timestamp(5), end: timestamp(10) },
    ]);
  } finally {
    fetchLogs.mockRestore();
  }
});
