import { useState } from "react";
import {
  RiCheckLine,
  RiCloseLine,
  RiShieldUserLine,
  RiUserForbidLine,
  RiUserSettingsLine,
} from "@remixicon/react";
import { canManageUsers, canModerate, type Role } from "@g13/auth";
import { AlignAvatar } from "@/ui/avatar";
import { AlignBadge } from "@/ui/badge";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { Typography } from "@/ui/typography";
import type { loadAdminUsers } from "../-server/handler";
import type { AssignRoleInput } from "../-shared/schemas";

type User = Awaited<ReturnType<typeof loadAdminUsers>>["rows"][number];
type PrivilegedRole = Extract<Role, "maintainer" | "admin">;

const roleOptions: Array<{ value: PrivilegedRole; label: string; description: string }> = [
  {
    value: "maintainer",
    label: "Maintainer",
    description: "Inspect, hide, restore, and soft-delete reviews.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Full moderation access, plus approving accounts and assigning roles.",
  },
];

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
  const [step, setStep] = useState<"idle" | "choose-role">("idle");
  const [role, setRole] = useState<PrivilegedRole>(user.role === "admin" ? "admin" : "maintainer");
  const ownAccount = user.id === identityId;
  const previewRole = ownAccount || step === "idle" ? user.role : role;
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
              {ownAccount
                ? "Permissions for your role"
                : step === "choose-role"
                  ? "Permissions after confirmation"
                  : "Current permissions"}
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
        <section className="shrink-0 border-t border-stroke-soft-200 p-3">
          {step === "idle" ? (
            approved ? (
              <div className="grid grid-cols-2 gap-2">
                <AlignButton.Root
                  size="small"
                  variant="neutral"
                  mode="stroke"
                  className="w-full gap-1.5 text-label-xs"
                  onClick={() => {
                    setRole(user.role === "admin" ? "admin" : "maintainer");
                    setStep("choose-role");
                  }}
                >
                  <RiUserSettingsLine className="size-3.5" />
                  Change role
                </AlignButton.Root>
                <AlignButton.Root
                  size="small"
                  variant="error"
                  mode="lighter"
                  className="w-full gap-1.5 text-label-xs"
                  onClick={() => onAssign({ userId: user.id, role: "user" }, user.name)}
                >
                  <RiUserForbidLine className="size-3.5" />
                  Revoke
                </AlignButton.Root>
              </div>
            ) : (
              <div className="space-y-2.5">
                <Typography variant="caption" className="block text-text-sub-600">
                  Verify this person before granting access.
                </Typography>
                <AlignFancyButton.Root
                  size="small"
                  className="w-full text-label-xs"
                  onClick={() => {
                    setRole("maintainer");
                    setStep("choose-role");
                  }}
                >
                  Approve account
                </AlignFancyButton.Root>
              </div>
            )
          ) : (
            <div className="space-y-3">
              <Typography as="h3" variant="labelSmall" className="text-text-strong-950">
                Choose role
              </Typography>
              <div role="radiogroup" aria-label="Choose role" className="space-y-1.5">
                {roleOptions.map((option) => {
                  const selected = role === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setRole(option.value)}
                      className={`w-full rounded-lg border p-2.5 text-left outline-none transition-colors focus-visible:outline-[1.5px] focus-visible:outline-offset-1 focus-visible:outline-primary-base/55 ${
                        selected
                          ? "border-primary-base bg-primary-alpha-10"
                          : "border-stroke-soft-200 bg-bg-white-0 hover:bg-bg-weak-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Typography as="span" variant="labelSmall" className="text-text-strong-950">
                          {option.label}
                        </Typography>
                        {selected && <RiCheckLine className="size-3.5 text-primary-base" />}
                      </div>
                      <Typography variant="caption" className="mt-0.5 block text-text-sub-600">
                        {option.description}
                      </Typography>
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <AlignButton.Root
                  size="small"
                  variant="neutral"
                  mode="stroke"
                  className="w-full text-label-xs"
                  onClick={() => setStep("idle")}
                >
                  Cancel
                </AlignButton.Root>
                <AlignFancyButton.Root
                  size="small"
                  className="w-full text-label-xs"
                  disabled={approved && role === user.role}
                  onClick={() => onAssign({ userId: user.id, role }, user.name)}
                >
                  {approved ? "Save role" : "Approve"}
                </AlignFancyButton.Root>
              </div>
            </div>
          )}
        </section>
      )}
    </aside>
  );
}
