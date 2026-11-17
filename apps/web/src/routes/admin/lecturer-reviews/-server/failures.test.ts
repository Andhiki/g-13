import { expect, it, spyOn } from "bun:test";
import { createServerEntry } from "@tanstack/react-start/server";
import { MODERATION_ERRORS, type ModerationOperationError } from "../-shared/errors";
import { runServerOperation } from "@/server/server-function-error";
import { rejectModerationOperation } from "./failures";

const moderationErrorCases: { error: ModerationOperationError; status: number }[] = [
  { error: MODERATION_ERRORS.FORBIDDEN, status: 403 },
  { error: MODERATION_ERRORS.REVIEW_ACTION_UNAVAILABLE, status: 409 },
];

for (const { error, status } of moderationErrorCases) {
  it(`rejects ${error} server-function calls with HTTP ${status}`, async () => {
    const consoleError = spyOn(console, "error").mockImplementation(() => {});
    try {
      const entry = createServerEntry({
        fetch: async () => {
          try {
            rejectModerationOperation(error);
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

it("logs unexpected moderation failures and rejects with a safe HTTP 500", async () => {
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
