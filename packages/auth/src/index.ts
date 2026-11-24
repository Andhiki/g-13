export type Role = "user" | "maintainer" | "admin";

export function canModerate(role: unknown): role is "maintainer" | "admin" {
  return role === "admin" || role === "maintainer";
}

export function canManageUsers(role: unknown): role is "admin" {
  return role === "admin";
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
