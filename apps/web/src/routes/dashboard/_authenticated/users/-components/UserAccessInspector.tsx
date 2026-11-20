import { useState } from "react";
import { RiCheckLine, RiCloseLine, RiShieldUserLine } from "@remixicon/react";
import { canManageUsers, canModerate, type Role } from "@g13/auth";
import { AlignAvatar } from "@/ui/avatar";
import { AlignBadge } from "@/ui/badge";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignSelect } from "@/ui/select";
import { Typography } from "@/ui/typography";
import type { loadAdminUsers } from "../-server/handler";
import type { AssignRoleInput } from "../-shared/schemas";

type User = Awaited<ReturnType<typeof loadAdminUsers>>["rows"][number];

export function UserAccessInspector({
  user,
  identityId,
  onAssign,
}: {
  user: User;
  identityId: string;
  onAssign: (input: AssignRoleInput, label: string) => void;
}) {
  const approved = canModerate(user.role);
  const [role, setRole] = useState<Role>(canModerate(user.role) ? user.role : "maintainer");
  const ownAccount = user.id === identityId;
  const previewRole = ownAccount ? user.role : role;
  const permissions: Array<[string, boolean]> = [
    ["Moderate reviews", canModerate(previewRole)],
    ["Approve accounts", canManageUsers(previewRole)],
    ["Assign roles", canManageUsers(previewRole)],
  ];
  return (
    <aside
      id="moderation-inspector"
      aria-label="Selected account details"
      className="hidden w-[320px] shrink-0 flex-col overflow-hidden border-l border-stroke-soft-200 bg-bg-white-0 xl:flex"
    >
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-stroke-soft-200 px-4 text-label-xs">
        <RiShieldUserLine className="size-3.5 text-text-sub-600" />
        Account details
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-5 p-4">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <AlignAvatar.Root size="32" aria-hidden="true" className="text-label-xs">
                {user.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </AlignAvatar.Root>
              <div className="min-w-0">
                <Typography as="h2" variant="label">
                  {user.name}
                </Typography>
                <Typography variant="caption" className="break-all text-text-sub-600">
                  {user.email}
                </Typography>
              </div>
            </div>
            <AlignBadge.Root
              size="medium"
              variant={approved ? "light" : "warning"}
              className="text-label-xs"
            >
              {approved ? "Approved" : "Awaiting approval"}
            </AlignBadge.Root>
          </div>
          <dl className="space-y-2.5 text-paragraph-xs">
            <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2">
              <dt className="text-text-sub-600">Joined</dt>
              <dd>{user.createdAt.toISOString().slice(0, 10)}</dd>
            </div>
            <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2">
              <dt className="text-text-sub-600">Current role</dt>
              <dd className="capitalize">{user.role}</dd>
            </div>
            <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2">
              <dt className="text-text-sub-600">Admin access</dt>
              <dd>{approved ? "Allowed" : "Not granted"}</dd>
            </div>
          </dl>
          {ownAccount && (
            <section className="border-t border-stroke-soft-200 pt-4">
              <Typography as="h3" variant="labelSmall">
                Manage access
              </Typography>
              <Typography variant="caption" className="mt-2 text-text-sub-600">
                Another administrator must manage your role.
              </Typography>
            </section>
          )}
          <section className="border-t border-stroke-soft-200 pt-4">
            <Typography as="h3" variant="labelSmall">
              Permissions {ownAccount ? "for your role" : "after confirmation"}
            </Typography>
            <dl className="mt-3 space-y-3 text-paragraph-xs">
              {permissions.map(([name, allowed]) => (
                <div key={name} className="flex items-center justify-between gap-2">
                  <dt className="text-text-sub-600">{name}</dt>
                  <dd className="flex items-center gap-1">
                    {allowed ? (
                      <RiCheckLine className="size-3.5 text-success-dark" />
                    ) : (
                      <RiCloseLine className="size-3.5 text-text-sub-600" />
                    )}
                    {allowed ? "Allowed" : "Not allowed"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
      {!ownAccount && (
        <section className="shrink-0 border-t border-stroke-soft-200 p-4">
          <Typography as="h3" variant="labelSmall">
            {approved ? "Manage access" : "Approve account"}
          </Typography>
          <Typography variant="caption" className="mt-1 break-words text-text-sub-600">
            {user.name}
          </Typography>
          <Typography variant="caption" className="mt-2 text-text-sub-600">
            Verify this person before granting access. GitHub sign-in and a verified email do not
            establish administrator approval.
          </Typography>
          <Typography
            as="label"
            htmlFor="account-role"
            variant="labelSmall"
            className="mb-2 mt-3 block"
          >
            Assign role
          </Typography>
          <AlignSelect.Root
            variant="compact"
            value={role}
            onValueChange={(value) => {
              if (value === "user" || value === "maintainer" || value === "admin") setRole(value);
            }}
          >
            <AlignSelect.Trigger id="account-role" className="h-8 min-h-8 w-full text-paragraph-xs">
              <AlignSelect.Value />
            </AlignSelect.Trigger>
            <AlignSelect.Content>
              {(approved ? ["user", "maintainer", "admin"] : ["maintainer", "admin"]).map(
                (value) => (
                  <AlignSelect.Item key={value} value={value}>
                    {value}
                  </AlignSelect.Item>
                ),
              )}
            </AlignSelect.Content>
          </AlignSelect.Root>
          <AlignFancyButton.Root
            className="mt-3 h-8 w-full text-label-xs"
            disabled={role === user.role}
            onClick={() => onAssign({ userId: user.id, role }, user.name)}
          >
            {role === "user"
              ? "Revoke privileged access"
              : approved
                ? "Confirm role change"
                : "Approve & assign role"}
          </AlignFancyButton.Root>
          <Typography variant="caption" className="mt-2 text-text-sub-600">
            A confirmation is required. Access changes take effect on the next protected request.
          </Typography>
        </section>
      )}
    </aside>
  );
}
