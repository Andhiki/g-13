import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  RiArchiveLine,
  RiCheckDoubleLine,
  RiCheckLine,
  RiExternalLinkLine,
  RiNotification3Line,
} from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { AlignPopover } from "@/ui/popover";
import { SmallLoading } from "@/ui/small-loading";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import { notificationPopoverQuery } from "../notifications/-client/queries";
import { useNotificationActions } from "../notifications/-client/useNotificationActions";
import { usePendingNotificationReadIds } from "../notifications/-client/usePendingNotificationReads";
import type { NotificationItem } from "../notifications/-server/repository";
import { getNotificationPresentation } from "../notifications/-shared/schemas";
import { formatAbsoluteTime, formatRelativeTime } from "@/date-format";

function NotificationPopoverItem({
  item,
  busy,
  onClose,
  onRead,
  onArchive,
}: {
  item: NotificationItem;
  busy: boolean;
  onClose: () => void;
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const { text, language } = useLocale("notifications");
  const { titleKey, bodyKey, interpolation, linkTarget } = getNotificationPresentation(item);
  return (
    <li className="flex items-start justify-between gap-2.5 px-3.5 py-2.5 hover:bg-bg-weak-50/70">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block size-1.5 shrink-0 rounded-full bg-primary-base"
            aria-label={text("status.unread")}
          />
          <Typography as="p" variant="labelSmall" color="strong" className="truncate">
            {text(titleKey, interpolation)}
          </Typography>
          <Typography
            variant="caption"
            color="muted"
            className="shrink-0"
            title={formatAbsoluteTime(item.createdAt, language)}
          >
            · {formatRelativeTime(item.createdAt, language)}
          </Typography>
        </div>
        <Typography variant="caption" color="muted" className="block">
          {text(bodyKey, interpolation)}
        </Typography>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
        {linkTarget && (
          <AlignButton.Root
            asChild
            size="xxsmall"
            variant="neutral"
            mode="ghost"
            iconOnly
            aria-label={text("action.open")}
            title={text("action.open")}
            onClick={onClose}
          >
            <Link to={linkTarget.to} search={linkTarget.search}>
              <RiExternalLinkLine className="size-3.5" />
            </Link>
          </AlignButton.Root>
        )}
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          iconOnly
          aria-label={text("action.markRead")}
          title={text("action.markRead")}
          disabled={busy}
          onClick={() => onRead(item.id)}
        >
          <RiCheckLine className="size-3.5" />
        </AlignButton.Root>
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          iconOnly
          aria-label={text("action.archive")}
          title={text("action.archive")}
          disabled={busy}
          onClick={() => onArchive(item.id)}
        >
          <RiArchiveLine className="size-3.5" />
        </AlignButton.Root>
      </div>
    </li>
  );
}

function NotificationPopoverList({
  isError,
  isPending,
  items,
  isBusy,
  onClose,
  onRead,
  onArchive,
}: {
  isError: boolean;
  isPending: boolean;
  items: NotificationItem[];
  isBusy: (id: string) => boolean;
  onClose: () => void;
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const { text } = useLocale("notifications");
  if (isError) {
    return (
      <div className="px-3.5 py-6 text-center">
        <Typography role="alert" variant="caption" color="danger">
          {text("error.load")}
        </Typography>
      </div>
    );
  }
  if (isPending) {
    return (
      <div className="flex justify-center px-3.5 py-6">
        <SmallLoading label={text("status.loading")} />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="px-3.5 py-8 text-center">
        <Typography variant="caption" color="muted">
          {text("empty.unread")}
        </Typography>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-stroke-soft-200">
      {items.map((item) => (
        <NotificationPopoverItem
          key={item.id}
          item={item}
          busy={isBusy(item.id)}
          onClose={onClose}
          onRead={onRead}
          onArchive={onArchive}
        />
      ))}
    </ul>
  );
}

function NotificationsPopoverPanel({
  hasUnread,
  markingAllRead,
  isBusy,
  readMutationError,
  isError,
  isPending,
  items,
  onClose,
  onMarkAllRead,
  onRead,
  onArchive,
}: {
  hasUnread: boolean;
  markingAllRead: boolean;
  isBusy: (id: string) => boolean;
  readMutationError: boolean;
  isError: boolean;
  isPending: boolean;
  items: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const { text } = useLocale("notifications");
  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-stroke-soft-200 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <Typography as="p" variant="label" color="strong">
            {text("title")}
          </Typography>
        </div>
        {hasUnread && (
          <AlignButton.Root
            size="xxsmall"
            variant="neutral"
            mode="ghost"
            iconOnly
            aria-label={text("action.markAllRead")}
            title={text("action.markAllRead")}
            disabled={markingAllRead}
            onClick={onMarkAllRead}
          >
            <RiCheckDoubleLine className="size-4" />
          </AlignButton.Root>
        )}
      </div>
      {readMutationError && (
        <div className="border-b border-stroke-soft-200 bg-error-lighter px-3.5 py-2">
          <Typography role="alert" variant="caption" color="danger">
            {text("error.update")}
          </Typography>
        </div>
      )}
      <div className="max-h-[340px] overflow-y-auto">
        <NotificationPopoverList
          isError={isError}
          isPending={isPending}
          items={items}
          isBusy={isBusy}
          onClose={onClose}
          onRead={onRead}
          onArchive={onArchive}
        />
      </div>
      <div className="border-t border-stroke-soft-200 bg-bg-weak-50/50 px-2 py-1.5">
        <AlignButton.Root
          asChild
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          className="w-full justify-center"
          onClick={onClose}
        >
          <Link to="/dashboard/notifications">{text("action.viewAll")}</Link>
        </AlignButton.Root>
      </div>
    </>
  );
}

export function NotificationsPopover({ side = "right" }: { side?: "right" | "bottom" }) {
  const [open, setOpen] = useState(false);
  const { text } = useLocale("notifications");

  const listQuery = useQuery({ ...notificationPopoverQuery(), enabled: false });
  const pendingReadIdSet = usePendingNotificationReadIds();
  const serverRows = listQuery.data?.rows ?? [];
  const hasUnread = serverRows.some((item) => !pendingReadIdSet.has(item.id));
  const items = serverRows.filter((item) => !pendingReadIdSet.has(item.id)).slice(0, 8);

  const { readMutation, readAllMutation, archiveMutation, isBusy } = useNotificationActions();

  return (
    <AlignPopover.Root open={open} onOpenChange={setOpen}>
      <AlignPopover.Trigger asChild>
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          size="xsmall"
          iconOnly
          active={open}
          className="relative shrink-0"
          aria-label={text("title")}
          title={text("title")}
        >
          <RiNotification3Line className="size-4 text-text-sub-600" />
          {hasUnread && (
            <span
              className="absolute top-1 right-1 size-2 rounded-full bg-primary-base"
              aria-label={text("status.unread")}
            />
          )}
        </AlignButton.Root>
      </AlignPopover.Trigger>
      <AlignPopover.Content
        side={side}
        align="end"
        sideOffset={10}
        showArrow={false}
        className="w-[340px] max-w-[calc(100vw-24px)] overflow-hidden p-0 sm:w-[372px]"
      >
        <NotificationsPopoverPanel
          hasUnread={hasUnread}
          markingAllRead={readAllMutation.isPending}
          isBusy={isBusy}
          readMutationError={readMutation.isError}
          isError={listQuery.isError}
          isPending={listQuery.isPending}
          items={items}
          onClose={() => setOpen(false)}
          onMarkAllRead={() => readAllMutation.mutate()}
          onRead={(id) => readMutation.mutate(id)}
          onArchive={(id) => archiveMutation.mutate(id)}
        />
      </AlignPopover.Content>
    </AlignPopover.Root>
  );
}
