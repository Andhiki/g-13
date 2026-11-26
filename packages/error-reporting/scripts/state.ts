import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";

const stateSchema = z.object({
  cursor: z.number().int().nonnegative(),
  fingerprints: z.record(z.string().regex(/^[a-f0-9]{16}$/), z.number().int().nonnegative()),
  disabled: z.array(z.string().regex(/^[a-f0-9]{16}$/)).default([]),
  fixSessions: z.array(z.number().int().nonnegative()),
  consecutiveFailures: z.number().int().nonnegative(),
});
export type State = z.infer<typeof stateSchema>;

export function initialState(now: number): State {
  return { cursor: now, fingerprints: {}, disabled: [], fixSessions: [], consecutiveFailures: 0 };
}

export async function loadState(path: string, now: number): Promise<State> {
  try {
    return stateSchema.parse(JSON.parse(await readFile(path, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return initialState(now);
  }
}

export async function saveState(path: string, state: State) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(state, null, 2) + "\n", { mode: 0o600, flag: "wx" });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}
