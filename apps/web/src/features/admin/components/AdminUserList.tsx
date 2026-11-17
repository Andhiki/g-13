import { canModerate } from "@g13/auth";
import { AlignAvatar } from "../../../ui/avatar";
import { AlignBadge } from "../../../ui/badge";
import { AlignButton } from "../../../ui/button";
import { AlignSelect } from "../../../ui/select";
import { Typography } from "../../../ui/typography";
import type { loadAdminUsers } from "../server/handler";
import type { AssignRoleInput } from "../shared/schemas";

type Users = Awaited<ReturnType<typeof loadAdminUsers>>["rows"];

export function AdminUserList({
  users,
  identityId,
  selectedId,
  onSelect,
  onAssign,
}: {
  users: Users;
  identityId: string;
  selectedId?: string;
  onSelect: (userId: string) => void;
  onAssign: (input: AssignRoleInput, label: string) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-4 border-b border-stroke-soft-200 bg-bg-white-0 px-4 py-2 text-label-xs text-text-strong-950 md:sticky md:top-0 md:z-10 md:grid-cols-[minmax(0,1fr)_160px_104px_104px]">
        <span>Account</span>
        <span className="hidden text-center md:block">Approval</span>
        <span className="hidden text-center md:block">Joined</span>
        <span className="text-right md:text-center">Role</span>
      </div>
      {users.slice(0, 50).map((user) => (
        <div
          key={user.id}
          data-selected={selectedId === user.id}
          className="grid grid-cols-[minmax(0,1fr)_120px] items-start gap-4 border-b border-stroke-soft-200 px-4 py-3 hover:bg-bg-weak-50/60 xl:data-[selected=true]:bg-warning-lighter xl:data-[selected=true]:hover:bg-warning-lighter md:grid-cols-[minmax(0,1fr)_160px_104px_104px] md:items-center"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <AlignAvatar.Root size="32" aria-hidden="true" className="text-label-xs">
              {user.name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </AlignAvatar.Root>
            <div className="min-w-0">
              <Typography variant="label" className="truncate font-semibold">
                <AlignButton.Root
                  variant="neutral"
                  mode="ghost"
                  size="xxsmall"
                  className="hidden h-auto max-w-full truncate rounded-sm p-0 text-label-sm text-text-strong-950 hover:bg-transparent hover:underline xl:block"
                  aria-label={`Inspect account ${user.name}`}
                  aria-pressed={selectedId === user.id}
                  onClick={() => onSelect(user.id)}
                >
                  {user.name}
                </AlignButton.Root>
                <span className="xl:hidden">{user.name}</span>
              </Typography>
              <Typography variant="caption" className="truncate text-text-sub-600">
                {user.email}
              </Typography>
              <Typography variant="caption" className="mt-1 text-text-sub-600 md:hidden">
                {canModerate(user.role) ? "Approved" : "Awaiting approval"} ·{" "}
                {user.createdAt.toISOString().slice(0, 10)}
              </Typography>
            </div>
          </div>
          <div className="hidden md:flex md:justify-center">
            <AlignBadge.Root
              size="medium"
              variant={canModerate(user.role) ? "light" : "warning"}
              className="text-label-xs"
            >
              {canModerate(user.role) ? "Approved" : "Awaiting approval"}
            </AlignBadge.Root>
          </div>
          <Typography
            variant="caption"
            className="hidden text-center text-text-strong-950 tabular-nums md:block"
          >
            {user.createdAt.toISOString().slice(0, 10)}
          </Typography>
          <div className="w-full md:w-fit md:justify-self-center">
            {user.id === identityId ? (
              <AlignBadge.Root
                size="medium"
                variant="light"
                className="h-7 w-full justify-center gap-1.5 text-label-xs text-text-strong-950 md:w-auto"
              >
                <span className="capitalize">{user.role}</span>
                <span aria-hidden="true" className="text-text-sub-600">
                  ·
                </span>
                <span className="text-text-sub-600">You</span>
              </AlignBadge.Root>
            ) : (
              <AlignSelect.Root
                variant="compact"
                value={user.role}
                onValueChange={(role) => {
                  if (role === "user" || role === "maintainer" || role === "admin")
                    onAssign({ userId: user.id, role }, user.name);
                }}
              >
                <AlignSelect.Trigger
                  aria-label={`Role for ${user.name}`}
                  className="h-7 min-h-7 w-full text-paragraph-xs md:w-auto"
                >
                  <AlignSelect.Value />
                </AlignSelect.Trigger>
                <AlignSelect.Content>
                  {["user", "maintainer", "admin"].map((role) => (
                    <AlignSelect.Item key={role} value={role}>
                      {role}
                    </AlignSelect.Item>
                  ))}
                </AlignSelect.Content>
              </AlignSelect.Root>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
