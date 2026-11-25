import { clsx } from "clsx";
import { RiCloseLine, RiEditLine, RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import {
  AdminTableAction,
  AdminTableInspectButton,
  AdminTableMeta,
  AdminTableRow,
} from "@/routes/dashboard/_authenticated/-components/AdminTable";
import { AlignBadge } from "@/ui/badge";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import { formatAbsoluteTime } from "@/date-format";
import type { loadAdminAnnouncements } from "../-server/handler";
import { announcementStatusLabel, resolveAnnouncementStatus } from "../-shared/status";
import type { AnnouncementLifecycleInput } from "../-shared/schemas";

export const announcementTableColumns = "lg:grid-cols-[minmax(0,1fr)_200px_110px_176px]";

export type AdminAnnouncement = Awaited<ReturnType<typeof loadAdminAnnouncements>>["rows"][number];

function AnnouncementStatusBadge({ announcement }: { announcement: AdminAnnouncement }) {
  const status = resolveAnnouncementStatus(announcement);
  return (
    <AlignBadge.Root
      size="medium"
      variant="light"
      className={clsx(
        "shrink-0",
        status === "live" && "bg-success-lighter text-success-dark",
        status === "scheduled" && "bg-information-lighter text-information-base",
        status === "expired" && "bg-bg-weak-50 text-text-sub-600",
        status === "disabled" && "bg-error-lighter text-error-dark",
      )}
    >
      {announcementStatusLabel(status)}
    </AlignBadge.Root>
  );
}

export function AdminAnnouncementRow({
  announcement,
  selected,
  onSelect,
  onEdit,
  onLifecycle,
}: {
  announcement: AdminAnnouncement;
  selected: boolean;
  onSelect: () => void;
  onEdit: (announcement: AdminAnnouncement) => void;
  onLifecycle: (input: AnnouncementLifecycleInput, label: string) => void;
}) {
  const { language } = useLocale("notifications");
  const label = announcement.titleId;
  const start = formatAbsoluteTime(announcement.startsAt.getTime(), language);
  const expiry =
    announcement.endsAt === null
      ? "No expiry"
      : `→ ${formatAbsoluteTime(announcement.endsAt.getTime(), language)}`;
  const countdown =
    announcement.countdownAt === null
      ? null
      : `Countdown · ${formatAbsoluteTime(announcement.countdownAt.getTime(), language)}`;
  const summary = [start, expiry, countdown, announcement.titleEn].filter(Boolean).join(" · ");

  return (
    <AdminTableRow
      selected={selected}
      onSelect={onSelect}
      className={`${announcementTableColumns} lg:items-center`}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2 lg:block">
          <AdminTableInspectButton
            ariaLabel={`Inspect ${label}`}
            selected={selected}
            onSelect={onSelect}
          >
            {announcement.titleId}
          </AdminTableInspectButton>
          <div className="lg:hidden">
            <AnnouncementStatusBadge announcement={announcement} />
          </div>
        </div>
        <Typography variant="caption" color="muted" className="mt-0.5 hidden truncate lg:block">
          {announcement.titleEn}
        </Typography>
        <AdminTableMeta>
          <span className="truncate" title={summary}>
            {summary}
          </span>
        </AdminTableMeta>
      </div>

      <div className="hidden min-w-0 lg:block">
        <Typography variant="caption" color="strong" className="block">
          {start}
        </Typography>
        <Typography variant="caption" color="muted" className="mt-0.5 block">
          {expiry}
        </Typography>
        {countdown && (
          <Typography variant="caption" color="muted" className="mt-0.5 block">
            {countdown}
          </Typography>
        )}
      </div>

      <div className="hidden lg:block">
        <AnnouncementStatusBadge announcement={announcement} />
      </div>

      <div className="hidden items-center justify-end gap-1 lg:flex">
        <AdminTableAction label="Edit" variant="neutral" onClick={() => onEdit(announcement)}>
          <RiEditLine aria-hidden="true" className="size-3.5" />
        </AdminTableAction>
        {announcement.enabled ? (
          <AdminTableAction
            label="Disable"
            variant="neutral"
            onClick={() =>
              onLifecycle({ announcementId: announcement.id, action: "disable" }, label)
            }
          >
            <RiEyeOffLine aria-hidden="true" className="size-3.5" />
          </AdminTableAction>
        ) : (
          <AdminTableAction
            label="Enable"
            variant="neutral"
            onClick={() =>
              onLifecycle({ announcementId: announcement.id, action: "enable" }, label)
            }
          >
            <RiEyeLine aria-hidden="true" className="size-3.5" />
          </AdminTableAction>
        )}
        <AdminTableAction
          label="Delete"
          variant="error"
          onClick={() => onLifecycle({ announcementId: announcement.id, action: "delete" }, label)}
        >
          <RiCloseLine aria-hidden="true" className="size-3.5" />
        </AdminTableAction>
      </div>
    </AdminTableRow>
  );
}
