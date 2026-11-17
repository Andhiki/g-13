import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPlatformProxy } from "wrangler";

const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const configPath = fileURLToPath(new URL("../../wrangler.jsonc", import.meta.url));

export async function createTestPlatformProxy() {
  const persistenceRoot = await mkdtemp(join(tmpdir(), "g13-d1-test-"));

  try {
    const migration = Bun.spawn(
      [
        process.execPath,
        "x",
        "wrangler",
        "d1",
        "migrations",
        "apply",
        "lecturer-reviews",
        "--config",
        configPath,
        "--local",
        "--persist-to",
        persistenceRoot,
      ],
      {
        cwd: repositoryRoot,
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

    const platform = await getPlatformProxy<{ DB: D1Database }>({
      configPath,
      persist: { path: join(persistenceRoot, "v3") },
      remoteBindings: false,
    });

    return {
      ...platform,
      dispose: async () => {
        try {
          await platform.dispose();
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
