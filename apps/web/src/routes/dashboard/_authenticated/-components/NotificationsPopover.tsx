import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { notificationsQuery, unreadNotificationCountQuery } from "../notifications/-client/queries";
import {
  archiveNotificationAction,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../notifications/-server/handler";
import { resolveNotificationLink } from "../notifications/-shared/schemas";
import { formatAbsoluteTime, formatRelativeTime } from "../notifications/-shared/time";

export function NotificationsPopover({ side = "right" }: { side?: "right" | "top" }) {
  const [open, setOpen] = useState(false);
  const { text, language } = useLocale("notifications");
  const queryClient = useQueryClient();

  const unreadQuery = useQuery(unreadNotificationCountQuery());
  const listQuery = useQuery({
    ...notificationsQuery(0, "unread"),
    enabled: open,
  });

  const unreadCount = listQuery.data?.counts.unread ?? unreadQuery.data?.unread ?? 0;
  const items = (listQuery.data?.rows ?? []).slice(0, 8);

  async function invalidateNotifications() {
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  const readMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead({ data: { notificationId } }),
    onSuccess: invalidateNotifications,
  });

  const readAllMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: invalidateNotifications,
  });

  const archiveMutation = useMutation({
    mutationFn: (notificationId: string) => archiveNotificationAction({ data: { notificationId } }),
    onSuccess: invalidateNotifications,
  });

  const busy = readMutation.isPending || readAllMutation.isPending || archiveMutation.isPending;

  return (
    <AlignPopover.Root open={open} onOpenChange={setOpen}>
      <AlignPopover.Trigger asChild>
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          size="xsmall"
          className="relative size-7 shrink-0 px-0"
          aria-label={text("title")}
          title={text("title")}
        >
          <RiNotification3Line className="size-4 text-text-sub-600" />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex min-w-3.5 items-center justify-center rounded-full bg-primary-base px-1 text-[10px] leading-[14px] font-medium text-static-white tabular-nums">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
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
        <div className="flex items-center justify-between gap-2 border-b border-stroke-soft-200 px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <Typography as="p" variant="label" className="text-text-strong-950">
              {text("title")}
            </Typography>
            {unreadCount > 0 && (
              <span className="rounded-full bg-bg-soft-200 px-1.5 py-0.5 text-[11px] leading-none font-medium text-text-sub-600 tabular-nums">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <AlignButton.Root
              size="xxsmall"
              variant="neutral"
              mode="ghost"
              className="size-7 px-0"
              aria-label={text("action.markAllRead")}
              title={text("action.markAllRead")}
              disabled={busy}
              onClick={() => readAllMutation.mutate()}
            >
              <RiCheckDoubleLine className="size-4" />
            </AlignButton.Root>
          )}
        </div>

        <div className="max-h-[340px] overflow-y-auto">
          {listQuery.isError ? (
            <div className="px-3.5 py-6 text-center">
              <Typography role="alert" variant="caption" className="text-error-base">
                {text("error.load")}
              </Typography>
            </div>
          ) : listQuery.isPending ? (
            <div className="flex justify-center px-3.5 py-6">
              <SmallLoading label={text("status.loading")} />
            </div>
          ) : items.length === 0 ? (
            <div className="px-3.5 py-8 text-center">
              <Typography variant="caption" className="text-text-sub-600">
                {text("empty.unread")}
              </Typography>
            </div>
          ) : (
            <ul className="divide-y divide-stroke-soft-200">
              {items.map((item) => {
                const isKnown =
                  item.type === "review.created" ||
                  item.type === "user.pending_approval" ||
                  item.type === "user.role_updated";
                const titleKey = isKnown ? `event.${item.type}.title` : "event.unknown.title";
                const bodyKey = isKnown ? `event.${item.type}.body` : "event.unknown.body";
                const interpolation = {
                  ...item.payload,
                  resourceType: item.resourceType,
                  resourceId: item.resourceId,
                };
                const linkTarget = resolveNotificationLink(item.resourceType, item.resourceId);

                return (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-2.5 px-3.5 py-2.5 hover:bg-bg-weak-50/70"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-block size-1.5 shrink-0 rounded-full bg-primary-base"
                          aria-label={text("status.unread")}
                        />
                        <Typography
                          as="p"
                          variant="labelSmall"
                          className="truncate text-text-strong-950"
                        >
                          {text(titleKey, interpolation)}
                        </Typography>
                        <Typography
                          variant="caption"
                          className="shrink-0 text-text-sub-600"
                          title={formatAbsoluteTime(item.createdAt, language)}
                        >
                          · {formatRelativeTime(item.createdAt, language)}
                        </Typography>
                      </div>
                      <Typography variant="caption" className="block text-text-sub-600">
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
                          className="size-7 px-0"
                          aria-label={text("action.open")}
                          title={text("action.open")}
                          onClick={() => setOpen(false)}
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
                        className="size-7 px-0"
                        aria-label={text("action.markRead")}
                        title={text("action.markRead")}
                        disabled={busy}
                        onClick={() => readMutation.mutate(item.id)}
                      >
                        <RiCheckLine className="size-3.5" />
                      </AlignButton.Root>
                      <AlignButton.Root
                        size="xxsmall"
                        variant="neutral"
                        mode="ghost"
                        className="size-7 px-0"
                        aria-label={text("action.archive")}
                        title={text("action.archive")}
                        disabled={busy}
                        onClick={() => archiveMutation.mutate(item.id)}
                      >
                        <RiArchiveLine className="size-3.5" />
                      </AlignButton.Root>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-stroke-soft-200 bg-bg-weak-50/50 px-2 py-1.5">
          <AlignButton.Root
            asChild
            size="xxsmall"
            variant="neutral"
            mode="ghost"
            className="w-full justify-center text-label-xs"
            onClick={() => setOpen(false)}
          >
            <Link to="/dashboard/notifications">{text("action.viewAll")}</Link>
          </AlignButton.Root>
        </div>
      </AlignPopover.Content>
    </AlignPopover.Root>
  );
}
