import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";

const dbPackageRoot = fileURLToPath(new URL("../../../../packages/db", import.meta.url));
const testDatabaseId = "00000000-0000-4000-8000-000000000001";

let exportedSchemaSql: Promise<string> | undefined;

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

export async function createTestPlatformProxy() {
  const persistenceRoot = await mkdtemp(join(tmpdir(), "g13-d1-test-"));

  try {
    const schemaSql = await loadSchemaSql();
    const miniflare = new Miniflare({
      cf: false,
      resourcePersistencePath: join(persistenceRoot, "v3"),
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

    const env = await miniflare.getBindings<{ DB: D1Database }>("g-13-test");
    const statements = schemaSql
      .split(/;\s*(?:\r?\n|$)/)
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);
    await env.DB.batch(statements.map((statement) => env.DB.prepare(statement)));

    return {
      env,
      dispose: async () => {
        try {
          await miniflare.dispose();
        } finally {
          await rm(persistenceRoot, { recursive: true, force: true });
        }
      },
    };
  } catch (error) {
    await rm(persistenceRoot, { recursive: true, force: true });
    throw error;
  }
}
