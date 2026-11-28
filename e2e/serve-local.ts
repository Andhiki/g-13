import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { localE2eDatabaseId, localOrigin } from "./local-worker.ts";

const port = process.argv[2];
const origin = localOrigin(`http://127.0.0.1:${port}`);
const root = fileURLToPath(new URL("../", import.meta.url));
const appDirectory = join(root, "apps/web");
const cfCli = join(appDirectory, "node_modules/cf/bin/cf");
const viteCli = join(appDirectory, "node_modules/vite/bin/vite.js");

let child: ChildProcess | undefined;
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    stopping = true;
    child?.kill(signal);
  });
}

const statePath = await mkdtemp(join(tmpdir(), "g13-local-e2e-"));
const env = {
  ...process.env,
  E2E_BASE_URL: origin,
  E2E_D1_LOCAL_PATH: statePath,
};

async function run(label: string, args: string[]) {
  if (stopping) return;
  console.log(label);
  await new Promise<void>((resolve, reject) => {
    child = spawn(process.execPath, args, { cwd: appDirectory, env, stdio: "inherit" });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      child = undefined;
      if (code === 0 || stopping) resolve();
      else reject(new Error(`${label} exited with ${code ?? signal}`));
    });
  });
}

try {
  await run("Apply migrations to the temporary D1 database", [
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
  ]);
  await run("Build the local Worker", [viteCli, "build", "--mode", "local-e2e"]);
  await run("Start the local Worker preview", [
    viteCli,
    "preview",
    "--mode",
    "local-e2e",
    "--host",
    "127.0.0.1",
    "--port",
    port,
    "--strictPort",
  ]);
} finally {
  await rm(statePath, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
}
