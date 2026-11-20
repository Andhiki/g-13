export type Role = "user" | "maintainer" | "admin";

export function canModerate(role: unknown): role is "maintainer" | "admin" {
  return role === "admin" || role === "maintainer";
}

export function canManageUsers(role: unknown): role is "admin" {
  return role === "admin";
}
