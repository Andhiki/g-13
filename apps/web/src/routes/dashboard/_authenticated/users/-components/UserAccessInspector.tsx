import { useState } from "react";
import { RiCheckLine, RiCloseLine, RiUserSettingsLine } from "@remixicon/react";
import { canManageUsers, canModerate } from "@g13/auth";
import { AlignBadge } from "@/ui/badge";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { Typography } from "@/ui/typography";
import type { loadAdminUsers } from "../-server/handler";
import type { AssignRoleInput } from "../-shared/schemas";

import { roleOptions, type AssignableRole } from "./role-options";
import { AccountAvatar } from "./AccountAvatar";

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
  const [step, setStep] = useState<"idle" | "choose-role">("idle");
  const [role, setRole] = useState<AssignableRole>(user.role === "admin" ? "admin" : "maintainer");
  const choosing = step === "choose-role";
  const ownAccount = user.id === identityId;
  const previewRole = ownAccount || step === "idle" ? user.role : role;
  const permissions: Array<[string, boolean]> = [
    ["Moderate reviews", canModerate(previewRole)],
    ["Manage user access", canManageUsers(previewRole)],
  ];

  return (
    <aside
      id="moderation-inspector"
      aria-label="Selected account details"
      className="ml-auto flex h-full w-[320px] flex-col overflow-hidden border-l border-stroke-soft-200 bg-bg-white-0"
    >
      <div className="flex h-11 shrink-0 items-center border-b border-stroke-soft-200 px-4 text-label-xs">
        Account details
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-5 p-4">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <AccountAvatar name={user.name} image={user.image} />
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
            <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2">
              <dt className="text-text-sub-600">Joined</dt>
              <dd className="tabular-nums">{user.createdAt.toISOString().slice(0, 10)}</dd>
            </div>
            <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2">
              <dt className="text-text-sub-600">Role</dt>
              <dd className="capitalize">{user.role}</dd>
            </div>
          </dl>
          <section className="border-t border-stroke-soft-200 pt-4">
            <Typography as="h3" variant="labelSmall">
              {step === "choose-role" ? "Permissions after change" : "Permissions"}
            </Typography>
            <dl className="mt-3 space-y-2.5 text-paragraph-xs">
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
          {ownAccount && (
            <Typography
              variant="caption"
              className="border-t border-stroke-soft-200 pt-4 text-text-sub-600"
            >
              Another admin must change your role.
            </Typography>
          )}
        </div>
      </div>
      {!ownAccount && (
        <section
          data-choosing={choosing}
          className="group/role shrink-0 border-t border-stroke-soft-200"
        >
          <div
            inert={choosing}
            className="grid grid-rows-[1fr] transition-[grid-template-rows] duration-200 ease-out group-data-[choosing=true]/role:grid-rows-[0fr] motion-reduce:transition-none"
          >
            <div className="min-h-0 overflow-clip">
              <div className="p-3 transition-opacity duration-150 group-data-[choosing=true]/role:opacity-0 motion-reduce:transition-none">
                {approved ? (
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
                ) : (
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
                )}
              </div>
            </div>
          </div>
          <div
            inert={!choosing}
            className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out group-data-[choosing=true]/role:grid-rows-[1fr] motion-reduce:transition-none"
          >
            <div className="min-h-0 overflow-clip">
              <div className="space-y-3 p-3 opacity-0 transition-opacity duration-150 group-data-[choosing=true]/role:opacity-100 motion-reduce:transition-none">
                <Typography as="h3" variant="labelSmall" className="text-text-strong-950">
                  Choose role
                </Typography>
                <div role="radiogroup" aria-label="Choose role" className="space-y-1.5">
                  {roleOptions
                    .filter((option) => approved || option.value !== "user")
                    .map((option) => {
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
                            <Typography
                              as="span"
                              variant="labelSmall"
                              className="flex items-center gap-2 text-text-strong-950"
                            >
                              <option.Icon
                                aria-hidden="true"
                                className="size-4 shrink-0 text-text-sub-600"
                              />
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
            </div>
          </div>
        </section>
      )}
    </aside>
  );
}
