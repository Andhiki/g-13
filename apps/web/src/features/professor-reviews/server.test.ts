import { describe, expect, it, mock } from "bun:test";
import { readProfessorReviewsWhenEnabled } from "./server";

describe("professor review feature gate", () => {
  it("does not read or return professor data when the environment flag is disabled", async () => {
    const read = mock(() => Promise.resolve({ professors: ["private feature data"] }));
    expect(await readProfessorReviewsWhenEnabled(false, read)).toBeNull();
    expect(read).not.toHaveBeenCalled();
  });

  it("allows public reads when the environment flag is enabled", async () => {
    const data = { professors: ["public professor"] };
    expect(await readProfessorReviewsWhenEnabled(true, async () => data)).toBe(data);
  });
});
