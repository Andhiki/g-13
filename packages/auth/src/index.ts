export const ROLES = ["user", "maintainer", "admin"] as const;
export type Role = (typeof ROLES)[number];
export type Permission = "moderate" | "manage-users";

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function canModerate(role: unknown): role is "maintainer" | "admin" {
  return role === "admin" || role === "maintainer";
}

export function canManageUsers(role: unknown): role is "admin" {
  return role === "admin";
}

const permissionChecks: Record<Permission, (role: Role) => boolean> = {
  moderate: canModerate,
  "manage-users": canManageUsers,
};

export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  return role != null && permissionChecks[permission](role);
}

/**
 * Bootstrap policy: only emails listed in the server-only ADMIN_EMAILS
 * configuration may be elevated to admin automatically. The list is checked
 * against the verified GitHub email so a public visitor cannot claim it.
 */
export function isAllowlistedAdmin(email: unknown, allowlist: readonly string[]): boolean {
  if (typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 && allowlist.some((entry) => entry === normalized);
}
