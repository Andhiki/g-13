import { mkdirSync, writeFileSync } from "node:fs";
import { ensureDatabase, resetFixtures, verifyDatabase } from "./database.ts";
import { isolatedOrigin } from "./targets.ts";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} for isolated staging`);
  return value;
}

function writeWorkerSecrets() {
  const auth = required("E2E_AUTH_SECRET");
  const rateLimit = required("E2E_REVIEW_RATE_LIMIT_SECRET");
  if (auth.length < 32 || rateLimit.length < 32) {
    throw new Error("E2E_AUTH_SECRET and E2E_REVIEW_RATE_LIMIT_SECRET must have at least 32 characters");
  }
  const directory = process.env.RUNNER_TEMP ?? ".e2e";
  mkdirSync(directory, { recursive: true });
  const path = `${directory}/e2e-secrets.json`;
  writeFileSync(
    path,
    JSON.stringify({
      BETTER_AUTH_SECRET: auth,
      BETTER_AUTH_URL: isolatedOrigin,
      REVIEW_RATE_LIMIT_SECRET: rateLimit,
    }),
  );
  console.log(`Wrote isolated Worker secrets to ${path}`);
}

switch (process.argv[2]) {
  case "prepare-database":
    await ensureDatabase();
    break;
  case "write-secrets":
    writeWorkerSecrets();
    break;
  case "verify-database":
    await verifyDatabase();
    break;
  case "clean":
    await resetFixtures({ seed: false });
    break;
  case "wait": {
    const expected = process.env.VITE_E2E_REVISION;
    if (!expected) throw new Error("VITE_E2E_REVISION is required");
    for (let attempt = 1; attempt <= 24; attempt++) {
      try {
        const response = await fetch(`${isolatedOrigin}/api/alumni`, {
          redirect: "manual",
          cache: "no-store",
          signal: AbortSignal.timeout(5_000),
        });
        if (response.ok && response.headers.get("X-E2E-Revision") === expected) {
          console.log(`Isolated staging is serving revision ${expected}`);
          break;
        }
      } catch {
        // The Worker can be briefly unavailable during deployment.
      }
      if (attempt === 24) throw new Error("Isolated staging did not serve the deployed revision");
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
    break;
  }
  default:
    throw new Error("Expected prepare-database, write-secrets, verify-database, clean, or wait");
}
