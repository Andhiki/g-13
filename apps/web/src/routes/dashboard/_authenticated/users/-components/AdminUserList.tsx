import { canModerate } from "@g13/auth";
import { AlignBadge } from "@/ui/badge";
import {
  AdminTableHeader,
  AdminTableInspectButton,
  AdminTableRow,
} from "@/routes/dashboard/_authenticated/-components/AdminTable";
import { formatMonthYear } from "@/date-format";
import { useLocale } from "@/useLocale";
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
  const { language } = useLocale();
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
                <AdminTableInspectButton
                  as="p"
                  ariaLabel={`Inspect account ${user.name}`}
                  selected={selectedId === user.id}
                  onSelect={() => onSelect(user.id)}
                  className="truncate"
                >
                  {user.name}
                </AdminTableInspectButton>
                <Typography variant="caption" color="muted" className="truncate">
                  {user.email}
                </Typography>
                <Typography variant="caption" color="muted" className="mt-1 tabular-nums md:hidden">
                  {formatMonthYear(user.createdAt, language)}
                </Typography>
              </div>
            </div>
            <Typography
              variant="caption"
              color="strong"
              className="hidden text-center tabular-nums md:block"
            >
              {formatMonthYear(user.createdAt, language)}
            </Typography>
            <div className="flex justify-end md:justify-center">
              <AlignBadge.Root
                size="medium"
                variant={approved ? "light" : "warning"}
                className={`h-6 justify-center gap-1.5 ${approved ? "text-text-strong-950" : ""}`}
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
