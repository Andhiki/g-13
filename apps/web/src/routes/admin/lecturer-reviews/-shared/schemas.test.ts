import { expect, it } from "bun:test";
import { moderationPageSchema } from "./schemas";

it("validates protected pagination and status filters", () => {
  for (const status of ["all", "published", "hidden", "deleted"]) {
    expect(moderationPageSchema.safeParse({ offset: 0, status }).success).toBe(true);
  }
  for (const input of [
    { offset: -1, status: "all" },
    { offset: 0.5, status: "all" },
    { offset: 0, status: "draft" },
    { offset: 0 },
  ]) {
    expect(moderationPageSchema.safeParse(input).success).toBe(false);
  }
});
