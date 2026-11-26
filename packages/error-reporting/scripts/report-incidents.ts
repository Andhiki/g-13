import { readFile } from "node:fs/promises";
import { buildIncidentReport } from "./incidents";
import { parseLogRows } from "./rows";
import { reportIncidents } from "./runner";
import { monitoredServices } from "./services";
import { initialState } from "./state";

async function main() {
  const [flag, fixture] = process.argv.slice(2);
  if (flag && (flag !== "--fixture" || !fixture || process.argv.length !== 4)) {
    throw new Error("Invalid arguments");
  }
  const now = Date.now();
  const report = fixture
    ? buildIncidentReport(
        parseLogRows(JSON.parse(await readFile(fixture, "utf8")), {
          service: "g-13",
          environment: "production",
        }),
        initialState(now),
        now,
        undefined,
        false,
      ).report
    : await reportIncidents(monitoredServices(), now);
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (report) console.log(token ? report.replaceAll(token, "[redacted]") : report);
  return report ? 0 : 1;
}

if (import.meta.main) {
  try {
    process.exitCode = await main();
  } catch {
    console.error("Error reporting could not run. Check configuration and arguments.");
    process.exitCode = 1;
  }
}
