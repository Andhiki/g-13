import {
  AdminInspectorMeta,
  AdminInspectorMetaRow,
  AdminInspectorPanel,
} from "@/routes/dashboard/_authenticated/-components/AdminInspector";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { RiEditLine } from "@remixicon/react";
import { formatAbsoluteTime, formatRelativeTime } from "@/date-format";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import { resolveAnnouncementStatus } from "@/routes/-announcements/schedule";
import { announcementStatusLabel } from "../-shared/status";
import type { AnnouncementLifecycleInput } from "../-shared/schemas";
import type { AdminAnnouncement } from "./AdminAnnouncementRow";

function AnnouncementInspectorFooter({
  announcement,
  enabled,
  label,
  onEdit,
  onLifecycle,
}: {
  announcement: AdminAnnouncement;
  enabled: boolean;
  label: string;
  onEdit: (announcement: AdminAnnouncement) => void;
  onLifecycle: (input: AnnouncementLifecycleInput, label: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <AlignButton.Root
        size="xxsmall"
        variant="neutral"
        mode="ghost"
        compact
        onClick={() => onEdit(announcement)}
      >
        <RiEditLine className="size-3.5" />
        Edit
      </AlignButton.Root>
      <div className="flex items-center gap-1">
        {enabled ? (
          <AlignButton.Root
            size="xxsmall"
            variant="neutral"
            mode="stroke"
            onClick={() =>
              onLifecycle({ announcementId: announcement.id, action: "disable" }, label)
            }
          >
            Disable
          </AlignButton.Root>
        ) : (
          <AlignFancyButton.Root
            size="xxsmall"
            onClick={() =>
              onLifecycle({ announcementId: announcement.id, action: "enable" }, label)
            }
          >
            Enable
          </AlignFancyButton.Root>
        )}
        <AlignButton.Root
          size="xxsmall"
          variant="error"
          mode="ghost"
          compact
          onClick={() => onLifecycle({ announcementId: announcement.id, action: "delete" }, label)}
        >
          Delete
        </AlignButton.Root>
      </div>
    </div>
  );
}

function AnnouncementInspectorMeta({
  announcement,
  enabled,
}: {
  announcement: AdminAnnouncement;
  enabled: boolean;
}) {
  const { language } = useLocale("notifications");
  const expiresTitle = announcement.endsAt
    ? formatAbsoluteTime(announcement.endsAt.getTime(), language)
    : undefined;
  const expiresLabel = announcement.endsAt
    ? formatRelativeTime(announcement.endsAt.getTime(), language)
    : "Never";
  const countdownTitle = announcement.countdownAt
    ? formatAbsoluteTime(announcement.countdownAt.getTime(), language)
    : undefined;

  return (
    <AdminInspectorMeta>
      <AdminInspectorMetaRow label="ID" valueClassName="break-all font-mono text-text-sub-600">
        {announcement.id}
      </AdminInspectorMetaRow>
      <AdminInspectorMetaRow label="Enabled" valueClassName="tabular-nums">
        {enabled ? "Yes" : "No"}
      </AdminInspectorMetaRow>
      <AdminInspectorMetaRow
        label="Starts"
        valueClassName="tabular-nums"
        title={formatAbsoluteTime(announcement.startsAt.getTime(), language)}
      >
        {formatRelativeTime(announcement.startsAt.getTime(), language)}
      </AdminInspectorMetaRow>
      <AdminInspectorMetaRow label="Expires" valueClassName="tabular-nums" title={expiresTitle}>
        {expiresLabel}
      </AdminInspectorMetaRow>
      <AdminInspectorMetaRow label="Countdown" valueClassName="tabular-nums" title={countdownTitle}>
        {announcement.countdownAt
          ? formatRelativeTime(announcement.countdownAt.getTime(), language)
          : "None"}
      </AdminInspectorMetaRow>
      <AdminInspectorMetaRow label="CTA" valueClassName="break-all">
        {announcement.ctaHref ?? "—"}
      </AdminInspectorMetaRow>
      {announcement.ctaHref && (
        <AdminInspectorMetaRow label="CTA label" valueClassName="break-words">
          {announcement.ctaLabelId || announcement.ctaLabelEn || "Default"}
        </AdminInspectorMetaRow>
      )}
      <AdminInspectorMetaRow
        label="Updated"
        valueClassName="tabular-nums"
        title={formatAbsoluteTime(announcement.updatedAt.getTime(), language)}
      >
        {formatRelativeTime(announcement.updatedAt.getTime(), language)}
      </AdminInspectorMetaRow>
    </AdminInspectorMeta>
  );
}

export function AnnouncementInspector({
  announcement,
  onEdit,
  onLifecycle,
}: {
  announcement: AdminAnnouncement;
  onEdit: (announcement: AdminAnnouncement) => void;
  onLifecycle: (input: AnnouncementLifecycleInput, label: string) => void;
}) {
  const status = resolveAnnouncementStatus(announcement);
  const label = announcement.titleId;
  const enabled = announcement.enabled;

  return (
    <AdminInspectorPanel
      title="Announcement details"
      ariaLabel="Selected announcement details"
      footer={
        <AnnouncementInspectorFooter
          announcement={announcement}
          enabled={enabled}
          label={label}
          onEdit={onEdit}
          onLifecycle={onLifecycle}
        />
      }
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <Typography as="h2" variant="label" className="min-w-0 break-words">
            {announcement.titleId}
          </Typography>
          <span className="shrink-0 text-text-sub-600">· {announcementStatusLabel(status)}</span>
        </div>
        <Typography variant="caption" color="muted" className="mt-1 block break-words">
          {announcement.titleEn}
        </Typography>
      </div>
      <div className="space-y-2">
        <Typography variant="caption" color="muted" className="block break-words">
          {announcement.bodyId}
        </Typography>
        <Typography variant="caption" color="muted" className="block break-words">
          {announcement.bodyEn}
        </Typography>
      </div>
      <AnnouncementInspectorMeta announcement={announcement} enabled={enabled} />
    </AdminInspectorPanel>
  );
}
