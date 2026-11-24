import { expect, it } from "bun:test";
import { canManageUsers, canModerate, hasPermission, isAllowlistedAdmin, isRole } from "./index";

it("recognizes valid roles with isRole", () => {
  expect(isRole("admin")).toBe(true);
  expect(isRole("maintainer")).toBe(true);
  expect(isRole("user")).toBe(true);
  for (const value of [undefined, null, "", "moderator", "ADMIN", 123]) {
    expect(isRole(value)).toBe(false);
  }
});

it("checks role permissions via hasPermission", () => {
  expect(hasPermission("admin", "moderate")).toBe(true);
  expect(hasPermission("admin", "manage-users")).toBe(true);
  expect(hasPermission("maintainer", "moderate")).toBe(true);
  expect(hasPermission("maintainer", "manage-users")).toBe(false);
  expect(hasPermission("user", "moderate")).toBe(false);
  expect(hasPermission("user", "manage-users")).toBe(false);
  expect(hasPermission(null, "moderate")).toBe(false);
  expect(hasPermission(undefined, "manage-users")).toBe(false);
});

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
