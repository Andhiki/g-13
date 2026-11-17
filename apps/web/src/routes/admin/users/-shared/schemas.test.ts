import { expect, it } from "bun:test";
import { assignRoleSchema, userPageSchema } from "./schemas";

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
