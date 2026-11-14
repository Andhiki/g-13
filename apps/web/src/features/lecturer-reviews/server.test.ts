import { describe, expect, it, mock } from "bun:test";
import { readLecturerReviewsWhenEnabled } from "./server";

describe("lecturer review feature gate", () => {
  it("does not read or return lecturer data when the environment flag is disabled", async () => {
    const read = mock(() => Promise.resolve({ lecturers: ["private feature data"] }));
    expect(await readLecturerReviewsWhenEnabled(false, read)).toBeNull();
    expect(read).not.toHaveBeenCalled();
  });

  it("allows public reads when the environment flag is enabled", async () => {
    const data = { lecturers: ["public lecturer"] };
    expect(await readLecturerReviewsWhenEnabled(true, async () => data)).toBe(data);
  });
});
