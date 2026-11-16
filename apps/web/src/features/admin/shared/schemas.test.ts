import { expect, it } from "bun:test";
import { moderationPageSchema, assignRoleSchema, userPageSchema } from "./schemas";

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

it("validates account approval filters independently of review status", () => {
  for (const status of ["all", "pending", "approved"]) {
    expect(userPageSchema.safeParse({ offset: 0, status }).success).toBe(true);
  }
  expect(userPageSchema.safeParse({ offset: 0, status: "published" }).success).toBe(false);
  expect(userPageSchema.safeParse({ offset: -1, status: "pending" }).success).toBe(false);
});

it("permits only explicit supported role assignments", () => {
  expect(assignRoleSchema.parse({ userId: " user-one ", role: "maintainer" })).toEqual({
    userId: "user-one",
    role: "maintainer",
  });
  expect(assignRoleSchema.safeParse({ userId: "", role: "admin" }).success).toBe(false);
  expect(assignRoleSchema.safeParse({ userId: "user-one", role: "moderator" }).success).toBe(false);
});
