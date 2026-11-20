import { expect, it } from "bun:test";
import { canManageUsers, canModerate, isAllowlistedAdmin } from "./index";

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

it("elevates only explicitly allowlisted bootstrap emails", () => {
  const allowlist = ["andhikiandre@gmail.com", "second@example.test"];
  expect(isAllowlistedAdmin("andhikiandre@gmail.com", allowlist)).toBe(true);
  expect(isAllowlistedAdmin("  AndhikiAndre@Gmail.com ", allowlist)).toBe(true);
  expect(isAllowlistedAdmin("someone@example.test", allowlist)).toBe(false);
  expect(isAllowlistedAdmin("", allowlist)).toBe(false);
  expect(isAllowlistedAdmin(undefined, allowlist)).toBe(false);
  expect(isAllowlistedAdmin("andhikiandre@gmail.com", [])).toBe(false);
});
