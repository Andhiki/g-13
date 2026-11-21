import { clsx } from "clsx";
import { RiCloseLine, RiEditLine, RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import {
  AdminTableInspectButton,
  AdminTableRow,
} from "@/routes/dashboard/_authenticated/-components/AdminTable";
import { AlignBadge } from "@/ui/badge";
import { AlignButton } from "@/ui/button";
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

  return (
    <AdminTableRow
      selected={selected}
      onSelect={onSelect}
      className={`${announcementTableColumns} lg:items-center`}
    >
      <div className="min-w-0">
        <AdminTableInspectButton
          ariaLabel={`Inspect ${label}`}
          selected={selected}
          onSelect={onSelect}
        >
          {announcement.titleId}
        </AdminTableInspectButton>
        <Typography variant="caption" className="mt-0.5 block truncate text-text-sub-600">
          {announcement.titleEn} · {announcement.slug}
        </Typography>
      </div>

      <div className="min-w-0">
        <Typography variant="caption" className="block text-text-strong-950">
          {formatAbsoluteTime(announcement.startsAt.getTime(), language)}
        </Typography>
        <Typography variant="caption" className="mt-0.5 block text-text-sub-600">
          {announcement.endsAt === null
            ? "No expiry"
            : `→ ${formatAbsoluteTime(announcement.endsAt.getTime(), language)}`}
        </Typography>
      </div>

      <div>
        <AnnouncementStatusBadge announcement={announcement} />
      </div>

      <div className="flex items-center justify-end gap-1">
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          className="gap-1 text-label-xs"
          onClick={() => onEdit(announcement)}
        >
          <RiEditLine className="size-3.5" />
          Edit
        </AlignButton.Root>
        {announcement.enabled ? (
          <AlignButton.Root
            size="xxsmall"
            variant="neutral"
            mode="ghost"
            className="gap-1 text-label-xs"
            onClick={() =>
              onLifecycle({ announcementId: announcement.id, action: "disable" }, label)
            }
          >
            <RiEyeOffLine className="size-3.5" />
            Disable
          </AlignButton.Root>
        ) : (
          <AlignButton.Root
            size="xxsmall"
            variant="neutral"
            mode="ghost"
            className="gap-1 text-label-xs"
            onClick={() =>
              onLifecycle({ announcementId: announcement.id, action: "enable" }, label)
            }
          >
            <RiEyeLine className="size-3.5" />
            Enable
          </AlignButton.Root>
        )}
        <AlignButton.Root
          size="xxsmall"
          variant="error"
          mode="ghost"
          className="gap-1 text-label-xs text-error-dark"
          onClick={() => onLifecycle({ announcementId: announcement.id, action: "delete" }, label)}
        >
          <RiCloseLine className="size-3.5" />
          Delete
        </AlignButton.Root>
      </div>
    </AdminTableRow>
  );
}
