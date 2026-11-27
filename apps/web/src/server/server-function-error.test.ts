import { expect, spyOn, test } from "bun:test";
import { runServerOperation } from "./server-function-error";

test("logs unexpected server operation failures as structured events", async () => {
  const errors: unknown[] = [];
  const spy = spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    errors.push(args[0]);
  });

  try {
    await expect(
      runServerOperation(async () => {
        throw new TypeError("boom");
      }),
    ).rejects.toThrow();

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      event: "server_error",
      errorName: "TypeError",
      message: "boom",
    });
  } finally {
    spy.mockRestore();
  }
});

test("does not log successful server operations", async () => {
  const spy = spyOn(console, "error").mockImplementation(() => {});

  try {
    await expect(runServerOperation(async () => 42)).resolves.toBe(42);
    expect(spy).not.toHaveBeenCalled();
  } finally {
    spy.mockRestore();
  }
});
