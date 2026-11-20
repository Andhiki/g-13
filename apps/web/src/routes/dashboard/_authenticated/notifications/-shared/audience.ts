import { canManageUsers, canModerate } from "@g13/auth";

export type NotificationViewer = { id: string; role?: string | null };

// Recipients are fixed at dispatch, so privileged events are re-checked against the
// viewer's current role: a demoted account must not keep reading them.
const typePermissions: Record<string, (role: unknown) => boolean> = {
  "review.created": canModerate,
  "user.pending_approval": canManageUsers,
};

export function hiddenNotificationTypes(role: unknown): string[] {
  return Object.entries(typePermissions)
    .filter(([, allowed]) => !allowed(role))
    .map(([type]) => type);
}
