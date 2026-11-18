import { expect, it, spyOn } from "bun:test";
import { createServerEntry } from "@tanstack/react-start/server";
import { USER_ERRORS, type UserOperationError } from "../-shared/errors";
import { runServerOperation } from "@/server/server-function-error";
import { rejectUserOperation } from "./failures";

const userErrorCases: { error: UserOperationError; status: number }[] = [
  { error: USER_ERRORS.FORBIDDEN, status: 403 },
  { error: USER_ERRORS.USER_NOT_FOUND, status: 404 },
];

for (const { error, status } of userErrorCases) {
  it(`rejects ${error} server-function calls with HTTP ${status}`, async () => {
    const consoleError = spyOn(console, "error").mockImplementation(() => {});
    try {
      const entry = createServerEntry({
        fetch: async () => {
          try {
            rejectUserOperation(error);
          } catch (thrown: unknown) {
            expect(thrown).toBeInstanceOf(Error);
            expect(thrown).toHaveProperty("message", error);
            throw thrown;
          }
        },
      });
      const response = await entry.fetch(new Request("http://localhost"), {});
      expect(response.status).toBe(status);
    } finally {
      consoleError.mockRestore();
    }
  });
}

it("logs unexpected server failures and rejects with a safe HTTP 500", async () => {
  const databaseError = new Error("database details");
  const consoleError = spyOn(console, "error").mockImplementation(() => {});
  try {
    const entry = createServerEntry({
      fetch: async () => {
        try {
          await runServerOperation(async () => {
            throw databaseError;
          });
          throw new Error("Expected the server operation to reject");
        } catch (thrown: unknown) {
          expect(thrown).toBeInstanceOf(Error);
          expect(thrown).toHaveProperty("message", "INTERNAL_ERROR");
          throw thrown;
        }
      },
    });
    const response = await entry.fetch(new Request("http://localhost"), {});
    expect(response.status).toBe(500);
    expect(consoleError).toHaveBeenCalledWith("Unexpected server operation failure", databaseError);
    expect(await response.text()).not.toContain("database details");
  } finally {
    consoleError.mockRestore();
  }
});
