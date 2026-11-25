import { canModerate } from "@g13/auth";
import { AlignBadge } from "@/ui/badge";
import {
  AdminTableHeader,
  AdminTableInspectButton,
  AdminTableMeta,
  AdminTableRow,
} from "@/routes/dashboard/_authenticated/-components/AdminTable";
import { formatMonthYear } from "@/date-format";
import { useLocale } from "@/useLocale";
import { Typography } from "@/ui/typography";
import type { loadAdminUsers } from "../-server/handler";
import { AccountAvatar } from "./AccountAvatar";

const userTableColumns = "lg:grid-cols-[minmax(0,1fr)_104px_120px]";

type Users = Awaited<ReturnType<typeof loadAdminUsers>>["rows"];

function AdminUserRow({
  user,
  isSelf,
  selected,
  language,
  onSelect,
}: {
  user: Users[number];
  isSelf: boolean;
  selected: boolean;
  language: string;
  onSelect: () => void;
}) {
  const approved = canModerate(user.role);
  const joined = formatMonthYear(user.createdAt, language);
  const summary = `${user.email} · ${joined}`;
  return (
    <AdminTableRow
      selected={selected}
      onSelect={onSelect}
      className={`${userTableColumns} items-center`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <AccountAvatar name={user.name} image={user.image} />
        <div className="min-w-0">
          <AdminTableInspectButton
            as="p"
            ariaLabel={`Inspect account ${user.name}`}
            selected={selected}
            onSelect={onSelect}
            className="truncate"
          >
            {user.name}
          </AdminTableInspectButton>
          <Typography variant="caption" color="muted" className="hidden truncate lg:block">
            {user.email}
          </Typography>
          <AdminTableMeta>
            <span className="truncate" title={summary}>
              {summary}
            </span>
          </AdminTableMeta>
        </div>
      </div>
      <Typography
        variant="caption"
        color="strong"
        className="hidden text-center tabular-nums lg:block"
      >
        {joined}
      </Typography>
      <div className="flex justify-end max-lg:self-start lg:justify-center">
        <AlignBadge.Root
          size="medium"
          variant={approved ? "light" : "warning"}
          className={`h-6 justify-center gap-1.5 ${approved ? "text-text-strong-950" : ""}`}
        >
          <span className="capitalize">{approved ? user.role : "Pending"}</span>
          {approved && isSelf && (
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
}

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
      <AdminTableHeader className={`hidden lg:sticky lg:top-0 lg:z-10 lg:grid ${userTableColumns}`}>
        <span>Account</span>
        <span className="text-center">Joined</span>
        <span className="text-center">Role</span>
      </AdminTableHeader>
      {users.slice(0, 50).map((user) => (
        <AdminUserRow
          key={user.id}
          user={user}
          isSelf={user.id === identityId}
          selected={selectedId === user.id}
          language={language}
          onSelect={() => onSelect(user.id)}
        />
      ))}
    </>
  );
}
