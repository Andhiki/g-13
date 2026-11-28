import { describe, expect, it } from "bun:test";
import {
  loadAdminPage,
  projectAdminIdentity,
  runAdminOperation,
  unwrapAdminResult,
  type AdminDatabase,
} from "./admin-handler";

const fakeDb = {} as AdminDatabase;

const sessionUser = {
  id: "user-1",
  name: "Admin",
  email: "admin@example.test",
  role: "admin",
  image: "https://example.test/avatar.png",
  extraSecretField: "should-not-leak",
};

describe("projectAdminIdentity", () => {
  it("keeps only the public identity fields from the session user", () => {
    expect(projectAdminIdentity(sessionUser)).toEqual({
      id: "user-1",
      name: "Admin",
      email: "admin@example.test",
      role: "admin",
      image: "https://example.test/avatar.png",
    });
  });
});

describe("unwrapAdminResult", () => {
  const statuses = {
    FORBIDDEN: 403,
    NOT_FOUND: 404,
  } as const;

  it("returns data when error is null", () => {
    expect(unwrapAdminResult({ data: { ok: true }, error: null }, statuses)).toEqual({ ok: true });
  });

  it("rejects with the mapped HTTP status and error code", () => {
    const calls: Array<{ status: number; error: string }> = [];
    const reject = (status: number, error: "FORBIDDEN" | "NOT_FOUND"): never => {
      calls.push({ status, error });
      throw new Error(`${status}:${error}`);
    };

    expect(() => unwrapAdminResult({ data: null, error: "NOT_FOUND" }, statuses, reject)).toThrow(
      "404:NOT_FOUND",
    );
    expect(calls).toEqual([{ status: 404, error: "NOT_FOUND" }]);
  });
});

describe("runAdminOperation / loadAdminPage", () => {
  const statuses = { FORBIDDEN: 403, CONFLICT: 409 } as const;
  const options = {
    getDatabase: () => fakeDb,
    reject: (status: number, error: keyof typeof statuses): never => {
      throw new Error(`${status}:${error}`);
    },
  };

  it("runs operations, attaches projected identity, and maps domain errors", async () => {
    const loaded = await loadAdminPage(
      sessionUser,
      statuses,
      async (db) => {
        expect(db).toBe(fakeDb);
        return { data: { rows: ["a"], total: 1 }, error: null };
      },
      options,
    );
    expect(loaded).toEqual({
      rows: ["a"],
      total: 1,
      identity: {
        id: "user-1",
        name: "Admin",
        email: "admin@example.test",
        role: "admin",
        image: "https://example.test/avatar.png",
      },
    });

    await expect(
      runAdminOperation(statuses, async () => ({ data: null, error: "CONFLICT" }), options),
    ).rejects.toThrow("409:CONFLICT");
  });
});
