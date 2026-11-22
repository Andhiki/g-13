import { useState } from "react";
import { RiCheckLine, RiCloseLine, RiUserSettingsLine } from "@remixicon/react";
import { canManageUsers, canModerate } from "@g13/auth";
import {
  AdminInspectorMeta,
  AdminInspectorMetaRow,
  AdminInspectorPanel,
} from "@/routes/dashboard/_authenticated/-components/AdminInspector";
import { AlignBadge } from "@/ui/badge";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { formatMonthYear } from "@/date-format";
import { useLocale } from "@/useLocale";
import { Typography } from "@/ui/typography";
import type { loadAdminUsers } from "../-server/handler";
import type { AssignRoleInput } from "../-shared/schemas";
import { roleOptions, type AssignableRole } from "./role-options";
import { AccountAvatar } from "./AccountAvatar";

type User = Awaited<ReturnType<typeof loadAdminUsers>>["rows"][number];

function RoleOptionButton({
  option,
  selected,
  onSelect,
}: {
  option: (typeof roleOptions)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`w-full rounded-lg border p-2.5 text-left outline-none transition-colors focus-visible:outline-[1.5px] focus-visible:outline-offset-1 focus-visible:outline-primary-base/55 ${
        selected
          ? "border-primary-base bg-primary-alpha-10"
          : "border-stroke-soft-200 bg-bg-white-0 hover:bg-bg-weak-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <option.Icon aria-hidden="true" className="size-4 shrink-0 text-text-sub-600" />
          <Typography as="span" variant="labelSmall" color="strong">
            {option.label}
          </Typography>
        </span>
        {selected && <RiCheckLine className="size-3.5 text-primary-base" />}
      </div>
      <Typography variant="caption" color="muted" className="mt-0.5 block">
        {option.description}
      </Typography>
    </button>
  );
}

function RoleChooserPanel({
  options,
  role,
  approved,
  currentRole,
  onSelectRole,
  onCancel,
  onSave,
}: {
  options: typeof roleOptions;
  role: AssignableRole;
  approved: boolean;
  currentRole: User["role"];
  onSelectRole: (role: AssignableRole) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-3 p-3 opacity-0 transition-opacity duration-150 group-data-[choosing=true]/role:opacity-100 motion-reduce:transition-none">
      <Typography as="h3" variant="labelSmall" color="strong">
        Choose role
      </Typography>
      <div role="radiogroup" aria-label="Choose role" className="space-y-1.5">
        {options.map((option) => (
          <RoleOptionButton
            key={option.value}
            option={option}
            selected={role === option.value}
            onSelect={() => onSelectRole(option.value)}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <AlignButton.Root
          size="small"
          variant="neutral"
          mode="stroke"
          compact
          className="w-full"
          onClick={onCancel}
        >
          Cancel
        </AlignButton.Root>
        <AlignFancyButton.Root
          size="small"
          compact
          className="w-full"
          disabled={approved && role === currentRole}
          onClick={onSave}
        >
          {approved ? "Save role" : "Approve"}
        </AlignFancyButton.Root>
      </div>
    </div>
  );
}

function RolePanelCollapse({
  inert,
  gridClassName,
  children,
}: {
  inert: boolean;
  gridClassName: string;
  children: React.ReactNode;
}) {
  return (
    <div inert={inert} className={gridClassName}>
      <div className="min-h-0 overflow-clip">{children}</div>
    </div>
  );
}

function RoleAssignmentFooter({
  user,
  approved,
  choosing,
  role,
  onStartChoose,
  onSelectRole,
  onCancel,
  onSave,
}: {
  user: User;
  approved: boolean;
  choosing: boolean;
  role: AssignableRole;
  onStartChoose: () => void;
  onSelectRole: (role: AssignableRole) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const options = roleOptions.filter((option) => approved || option.value !== "user");
  return (
    <div data-choosing={choosing} className="group/role">
      <RolePanelCollapse
        inert={choosing}
        gridClassName="grid grid-rows-[1fr] transition-[grid-template-rows] duration-200 ease-out group-data-[choosing=true]/role:grid-rows-[0fr] motion-reduce:transition-none"
      >
        <div className="p-3 transition-opacity duration-150 group-data-[choosing=true]/role:opacity-0 motion-reduce:transition-none">
          {approved ? (
            <AlignButton.Root
              size="small"
              variant="neutral"
              mode="stroke"
              compact
              className="w-full"
              onClick={onStartChoose}
            >
              <RiUserSettingsLine className="size-3.5" />
              Change role
            </AlignButton.Root>
          ) : (
            <AlignFancyButton.Root size="small" compact className="w-full" onClick={onStartChoose}>
              Approve account
            </AlignFancyButton.Root>
          )}
        </div>
      </RolePanelCollapse>
      <RolePanelCollapse
        inert={!choosing}
        gridClassName="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out group-data-[choosing=true]/role:grid-rows-[1fr] motion-reduce:transition-none"
      >
        <RoleChooserPanel
          options={options}
          role={role}
          approved={approved}
          currentRole={user.role}
          onSelectRole={onSelectRole}
          onCancel={onCancel}
          onSave={onSave}
        />
      </RolePanelCollapse>
    </div>
  );
}

export function UserAccessInspector({
  user,
  identityId,
  onAssign,
}: {
  user: User;
  identityId: string;
  onAssign: (input: AssignRoleInput, label: string) => void;
}) {
  const { language } = useLocale();
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
    <AdminInspectorPanel
      title="Account details"
      ariaLabel="Selected account details"
      footerClassName=""
      footer={
        !ownAccount && (
          <RoleAssignmentFooter
            user={user}
            approved={approved}
            choosing={choosing}
            role={role}
            onStartChoose={() => {
              setRole(approved && user.role === "admin" ? "admin" : "maintainer");
              setStep("choose-role");
            }}
            onSelectRole={setRole}
            onCancel={() => setStep("idle")}
            onSave={() => onAssign({ userId: user.id, role }, user.name)}
          />
        )
      }
    >
      <div>
        <div className="mb-3 flex items-center gap-2.5">
          <AccountAvatar name={user.name} image={user.image} />
          <div className="min-w-0">
            <Typography as="h2" variant="label">
              {user.name}
            </Typography>
            <Typography variant="caption" color="muted" className="break-all">
              {user.email}
            </Typography>
          </div>
        </div>
        <AlignBadge.Root size="medium" variant={approved ? "light" : "warning"}>
          {approved ? "Approved" : "Awaiting approval"}
        </AlignBadge.Root>
      </div>
      <AdminInspectorMeta>
        <AdminInspectorMetaRow label="Joined" valueClassName="tabular-nums">
          {formatMonthYear(user.createdAt, language)}
        </AdminInspectorMetaRow>
        <AdminInspectorMetaRow label="Role" valueClassName="capitalize">
          {user.role}
        </AdminInspectorMetaRow>
      </AdminInspectorMeta>
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
        <section className="border-t border-stroke-soft-200 pt-4">
          <Typography variant="caption" color="muted">
            Another admin must change your role.
          </Typography>
        </section>
      )}
    </AdminInspectorPanel>
  );
}
