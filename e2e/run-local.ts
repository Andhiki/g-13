import { randomBytes } from "node:crypto";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { localE2eDatabaseId } from "./targets.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appDirectory = join(root, "apps/web");
const cfCli = join(appDirectory, "node_modules/cf/bin/cf");
const viteCli = join(appDirectory, "node_modules/vite/bin/vite.js");
const e2eCli = join(root, "node_modules/e2e/dist/cli/bin.js");
const activeChildren = new Set<ChildProcess>();

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    process.exitCode = signal === "SIGINT" ? 130 : 143;
    for (const child of activeChildren) child.kill(signal);
  });
}

async function availablePort() {
  const server = createServer();
  await new Promise<void>((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not reserve a local port");
  await new Promise<void>((resolveClose, reject) => {
    server.close((error) => (error ? reject(error) : resolveClose()));
  });
  return address.port;
}

function runMigration(statePath: string, env: NodeJS.ProcessEnv) {
  const result = spawnSync(
    process.execPath,
    [
      cfCli,
      "--mode",
      "local-e2e",
      "d1",
      "migrations",
      "apply",
      localE2eDatabaseId,
      "--dir",
      join(root, "packages/db/migrations"),
      "--local",
      "--persist-to",
      statePath,
    ],
    { cwd: appDirectory, env, encoding: "utf8", stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Local D1 migrations failed with exit code ${result.status}`);
}

function buildLocalWorker(env: NodeJS.ProcessEnv) {
  const result = spawnSync(process.execPath, [viteCli, "build", "--mode", "local-e2e"], {
    cwd: appDirectory,
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Local Worker build failed with exit code ${result.status}`);
}

function runProcess(command: string, args: string[], options: Parameters<typeof spawn>[2]) {
  return new Promise<number>((resolveRun, reject) => {
    const child = spawn(command, args, options);
    activeChildren.add(child);
    child.once("error", (error) => {
      activeChildren.delete(child);
      reject(error);
    });
    child.once("close", (code) => {
      activeChildren.delete(child);
      resolveRun(code ?? 1);
    });
  });
}

async function stopWorker(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const waitForClose = (timeoutMs: number) =>
    new Promise<boolean>((resolveClose) => {
      if (child.exitCode !== null || child.signalCode !== null) {
        resolveClose(true);
        return;
      }
      const timeout = setTimeout(() => {
        child.off("close", onClose);
        resolveClose(false);
      }, timeoutMs);
      const onClose = () => {
        clearTimeout(timeout);
        resolveClose(true);
      };
      child.once("close", onClose);
    });

  child.kill(process.platform === "win32" ? "SIGINT" : "SIGTERM");
  if (await waitForClose(5_000)) return;

  if (process.platform === "win32" && child.pid !== undefined) {
    const result = spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    if (result.error) throw result.error;
    await waitForClose(5_000);
  }
}

function removeTemporaryDirectory(path: string) {
  try {
    rmSync(path, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  } catch (error) {
    if (process.platform !== "win32") throw error;
    console.warn(`Could not remove temporary E2E state at ${path}:`, error);
  }
}

async function waitForWorker(child: ChildProcess, origin: string) {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error("The local Worker stopped before it became ready");
    }
    try {
      const response = await fetch(`${origin}/api/alumni`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2_000),
      });
      if (response.ok) {
        console.log(`Local Worker is ready at ${origin}`);
        return;
      }
    } catch {
      // Vite and the local Worker need a short startup window.
    }
    await new Promise((resolveSleep) => setTimeout(resolveSleep, 500));
  }
  throw new Error("The local Worker did not become ready within 60 seconds");
}

async function main() {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "g13-local-e2e-"));
  const statePath = join(temporaryDirectory, "d1-state");
  mkdirSync(statePath);

  let worker: ChildProcess | undefined;
  try {
    const port = await availablePort();
    const origin = `http://127.0.0.1:${port}`;
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      E2E_MODE: "isolated",
      E2E_BASE_URL: origin,
      E2E_D1_LOCAL_PATH: statePath,
      E2E_FIXTURE_TOKEN: randomBytes(32).toString("hex"),
      E2E_AUTH_SECRET: randomBytes(32).toString("hex"),
      E2E_REVIEW_RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
      E2E_TELEMETRY_DISABLED: "1",
      VITE_E2E_REVISION: "local",
    };

    console.log("Applying migrations to a temporary local D1 database");
    runMigration(statePath, env);

    console.log("Building the local Worker for browser tests");
    buildLocalWorker(env);

    console.log("Starting the local Cloudflare Worker preview");
    worker = spawn(
      process.execPath,
      [
        viteCli,
        "preview",
        "--mode",
        "local-e2e",
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
        "--strictPort",
      ],
      { cwd: appDirectory, env, stdio: "inherit" },
    );
    activeChildren.add(worker);
    worker.once("close", () => activeChildren.delete(worker!));
    worker.once("error", (error) => console.error("Local Worker process failed:", error));
    await waitForWorker(worker, origin);

    return await runProcess(process.execPath, [e2eCli, "run", ...process.argv.slice(2)], {
      cwd: root,
      env,
      stdio: "inherit",
    });
  } finally {
    if (worker && worker.exitCode === null && worker.signalCode === null) {
      await stopWorker(worker);
    }
    activeChildren.delete(worker!);
    removeTemporaryDirectory(temporaryDirectory);
  }
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(error);
  process.exitCode = process.exitCode || 1;
}
