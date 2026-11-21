import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";

const dbPackageRoot = fileURLToPath(new URL("../../../../packages/db", import.meta.url));
const testDatabaseId = "00000000-0000-4000-8000-000000000001";

interface BootedPlatform {
  miniflare: Miniflare;
  env: { DB: D1Database };
  tableNames: string[];
}

let exportedSchemaSql: Promise<string> | undefined;
let sharedPlatformEnabled = false;
let sharedPlatformPromise: Promise<BootedPlatform> | undefined;
let sharedLeaseHeld = false;
let sharedNeedsReset = false;

function loadSchemaSql(): Promise<string> {
  if (!exportedSchemaSql) {
    exportedSchemaSql = (async () => {
      const proc = Bun.spawn(
        [process.execPath, "x", "drizzle-kit", "export", "--config", "drizzle.config.ts"],
        {
          cwd: dbPackageRoot,
          env: { ...process.env, CI: "1" },
          stdout: "pipe",
          stderr: "pipe",
        },
      );
      const [exitCode, stdout, stderr] = await Promise.all([
        proc.exited,
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);
      if (exitCode !== 0) {
        throw new Error(`Exporting Drizzle test schema failed:\n${stdout}\n${stderr}`);
      }
      return stdout;
    })();
  }
  return exportedSchemaSql;
}

async function bootPlatform(): Promise<BootedPlatform> {
  const miniflare = new Miniflare({
    cf: false,
    enableDevRegistry: false,
    workers: [
      {
        config: {
          name: "g-13-test",
          compatibilityDate: "2026-10-19",
          manifest: {
            mainModule: "worker.mjs",
            modules: {
              "worker.mjs": {
                type: "esm",
                contents:
                  "export default { fetch() { return new Response(null, { status: 404 }); } };",
              },
            },
          },
          env: {
            DB: {
              type: "d1",
              id: testDatabaseId,
              name: "lecturer-reviews",
            },
          },
        },
      },
    ],
  });

  try {
    const [schemaSql, env] = await Promise.all([
      loadSchemaSql(),
      miniflare.getBindings<{ DB: D1Database }>("g-13-test"),
    ]);
    const statements = schemaSql
      .split(/;\s*(?:\r?\n|$)/)
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);
    if (statements.length > 0) {
      await env.DB.batch(statements.map((statement) => env.DB.prepare(statement)));
    }
    const { results } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND (name = 'sqlite_sequence' OR (name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'))",
    ).all<{ name: string }>();
    const tableNames = results.map((row) => row.name);
    return { miniflare, env, tableNames };
  } catch (error) {
    await miniflare.dispose().catch(() => {});
    throw error;
  }
}

async function resetDatabase(db: D1Database, tableNames: readonly string[]): Promise<void> {
  if (tableNames.length === 0) return;
  await db.batch([
    db.prepare("PRAGMA defer_foreign_keys = ON"),
    ...tableNames.map((table) => db.prepare(`DELETE FROM "${table.replaceAll('"', '""')}"`)),
  ]);
}

/** Enables process-wide reuse of a single in-memory Miniflare instance across tests. */
export function enableSharedTestPlatform(): void {
  sharedPlatformEnabled = true;
}

/** Disposes the shared Miniflare instance created during the current test run. */
export async function disposeSharedTestPlatform(): Promise<void> {
  const pending = sharedPlatformPromise;
  sharedPlatformPromise = undefined;
  sharedLeaseHeld = false;
  sharedNeedsReset = false;
  if (!pending) return;
  const booted = await pending.catch(() => undefined);
  await booted?.miniflare.dispose();
}

/** Returns a D1-backed Miniflare test proxy and its cleanup callback. */
export async function createTestPlatformProxy(): Promise<{
  env: { DB: D1Database };
  dispose: () => Promise<void>;
}> {
  if (sharedPlatformEnabled && !sharedLeaseHeld) {
    sharedLeaseHeld = true;
    try {
      if (!sharedPlatformPromise) {
        sharedPlatformPromise = bootPlatform().catch((error) => {
          sharedPlatformPromise = undefined;
          throw error;
        });
      }
      const booted = await sharedPlatformPromise;
      if (sharedNeedsReset) {
        await resetDatabase(booted.env.DB, booted.tableNames);
      }
      sharedNeedsReset = true;
      let disposed = false;
      return {
        env: booted.env,
        dispose: async () => {
          if (disposed) return;
          disposed = true;
          sharedLeaseHeld = false;
        },
      };
    } catch (error) {
      sharedLeaseHeld = false;
      throw error;
    }
  }

  const booted = await bootPlatform();
  let disposed = false;
  return {
    env: booted.env,
    dispose: async () => {
      if (disposed) return;
      disposed = true;
      await booted.miniflare.dispose();
    },
  };
}
