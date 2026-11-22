import { resetFixtures, verifyDatabase } from "./database.ts";
import { isolatedOrigin } from "./targets.ts";

switch (process.argv[2]) {
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
    throw new Error("Expected verify-database, clean, or wait");
}
