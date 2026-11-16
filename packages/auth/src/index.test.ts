import { expect, it } from "bun:test";
import { canManageUsers, canModerate } from "./index";

it("allows only explicit privileged roles to moderate", () => {
  expect(canModerate("admin")).toBe(true);
  expect(canModerate("maintainer")).toBe(true);
  for (const role of [undefined, null, "", "user", "moderator", "admin,user", "ADMIN"]) {
    expect(canModerate(role)).toBe(false);
    expect(canManageUsers(role)).toBe(false);
  }
});

it("reserves user approval and role management for administrators", () => {
  expect(canManageUsers("admin")).toBe(true);
  expect(canManageUsers("maintainer")).toBe(false);
});
