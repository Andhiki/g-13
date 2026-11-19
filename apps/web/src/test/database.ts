import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";

const webRoot = fileURLToPath(new URL("../../", import.meta.url));
const migrationsDir = fileURLToPath(new URL("../../../../packages/db/migrations", import.meta.url));
const testDatabaseId = "00000000-0000-4000-8000-000000000001";

export async function createTestPlatformProxy() {
  const persistenceRoot = await mkdtemp(join(tmpdir(), "g13-d1-test-"));

  try {
    const migration = Bun.spawn(
      [
        process.execPath,
        "x",
        "cf",
        "d1",
        "migrations",
        "apply",
        testDatabaseId,
        "--local",
        "--dir",
        migrationsDir,
        "--persist-to",
        persistenceRoot,
      ],
      {
        cwd: webRoot,
        env: { ...process.env, CI: "1" },
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    const [exitCode, stdout, stderr] = await Promise.all([
      migration.exited,
      new Response(migration.stdout).text(),
      new Response(migration.stderr).text(),
    ]);

    if (exitCode !== 0) {
      throw new Error(`Applying test D1 migrations failed:\n${stdout}\n${stderr}`);
    }

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
