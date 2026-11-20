import { canModerate } from "@g13/auth";
import { AlignBadge } from "@/ui/badge";
import { AlignButton } from "@/ui/button";
import {
  AdminTableHeader,
  AdminTableRow,
} from "@/routes/dashboard/_authenticated/-components/AdminTable";
import { Typography } from "@/ui/typography";
import type { loadAdminUsers } from "../-server/handler";
import { AccountAvatar } from "./AccountAvatar";

const userTableColumns = "grid-cols-[minmax(0,1fr)_120px] md:grid-cols-[minmax(0,1fr)_104px_120px]";

type Users = Awaited<ReturnType<typeof loadAdminUsers>>["rows"];

export function AdminUserList({
  users,
  identityId,
  selectedId,
  onSelect,
}: {
  users: Users;
  identityId: string;
  selectedId?: string;
  onSelect: (userId: string) => void;
}) {
  return (
    <>
      <AdminTableHeader className={`grid md:sticky md:top-0 md:z-10 ${userTableColumns}`}>
        <span>Account</span>
        <span className="hidden text-center md:block">Joined</span>
        <span className="text-right md:text-center">Role</span>
      </AdminTableHeader>
      {users.slice(0, 50).map((user) => {
        const approved = canModerate(user.role);
        return (
          <AdminTableRow
            key={user.id}
            selected={selectedId === user.id}
            onSelect={() => onSelect(user.id)}
            className={`${userTableColumns} items-center`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <AccountAvatar name={user.name} image={user.image} />
              <div className="min-w-0">
                <Typography variant="labelSmall" className="truncate font-medium">
                  <AlignButton.Root
                    variant="neutral"
                    mode="ghost"
                    size="xxsmall"
                    className="hidden h-auto max-w-full truncate rounded-sm p-0 text-label-xs text-text-strong-950 hover:bg-transparent hover:underline xl:block"
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
                <Typography
                  variant="caption"
                  className="mt-1 text-text-sub-600 tabular-nums md:hidden"
                >
                  {user.createdAt.toISOString().slice(0, 10)}
                </Typography>
              </div>
            </div>
            <Typography
              variant="caption"
              className="hidden text-center text-text-strong-950 tabular-nums md:block"
            >
              {user.createdAt.toISOString().slice(0, 10)}
            </Typography>
            <div className="flex justify-end md:justify-center">
              <AlignBadge.Root
                size="medium"
                variant={approved ? "light" : "warning"}
                className={`h-6 justify-center gap-1.5 text-label-xs ${approved ? "text-text-strong-950" : ""}`}
              >
                <span className="capitalize">{approved ? user.role : "Pending"}</span>
                {approved && user.id === identityId && (
                  <>
                    <span aria-hidden="true" className="text-text-sub-600">
                      ·
                    </span>
                    <span className="text-text-sub-600">You</span>
                  </>
                )}
              </AlignBadge.Root>
            </div>
          </AdminTableRow>
        );
      })}
    </>
  );
}
