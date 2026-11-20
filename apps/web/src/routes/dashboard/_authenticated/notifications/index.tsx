import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { canManageUsers } from "@g13/auth";
import {
  RiArchiveLine,
  RiCheckDoubleLine,
  RiCheckLine,
  RiExternalLinkLine,
} from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { Loading } from "@/ui/loading";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import { AdminPageHeader } from "../-components/AdminPageHeader";
import { SmallLoading } from "@/ui/small-loading";
import { notificationsQuery } from "./-client/queries";
import {
  archiveNotificationAction,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "./-server/handler";
import type { NotificationItem } from "./-server/repository";
import {
  notificationFilterSchema,
  resolveNotificationLink,
  type NotificationFilter,
} from "./-shared/schemas";
import { formatAbsoluteTime, formatRelativeTime } from "./-shared/time";

export const Route = createFileRoute("/dashboard/_authenticated/notifications/")({
  loader: async ({ context }) => {
    try {
      const result = await context.queryClient.fetchInfiniteQuery(notificationsQuery());
      return result.pages[0];
    } catch (error) {
      if (error instanceof Response && error.status === 401)
        throw redirect({ to: "/dashboard/login" });
      throw error;
    }
  },
  pendingComponent: () => (
    <div className="flex flex-1 items-center justify-center p-6">
      <Loading />
    </div>
  ),
  component: NotificationsPage,
});

function NotificationRow({
  item,
  busy,
  markingRead,
  archiving,
  onMarkRead,
  onArchive,
}: {
  item: NotificationItem;
  busy: boolean;
  markingRead: boolean;
  archiving: boolean;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const { text, language } = useLocale("notifications");
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
  const unread = item.readAt === null && item.archivedAt === null;

  return (
    <li
      className={`flex items-start justify-between gap-3 border-b border-stroke-soft-200 px-4 py-3 ${
        unread ? "bg-bg-weak-50/70" : "bg-bg-white-0"
      }`}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {unread && (
            <span
              className="inline-block size-2 shrink-0 rounded-full bg-primary-base"
              aria-label={text("status.unread")}
            />
          )}
          <Typography as="p" variant="label" className="text-text-strong-950">
            {text(titleKey, interpolation)}
          </Typography>
          <Typography
            variant="caption"
            className="text-text-sub-600"
            title={formatAbsoluteTime(item.createdAt, language)}
          >
            · {formatRelativeTime(item.createdAt, language)}
          </Typography>
        </div>
        <Typography variant="paragraph" className="text-paragraph-sm text-text-sub-600">
          {text(bodyKey, interpolation)}
        </Typography>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {linkTarget && (
          <AlignButton.Root
            asChild
            size="xxsmall"
            variant="neutral"
            mode="stroke"
            className="gap-1 text-label-xs"
          >
            <Link to={linkTarget.to} search={linkTarget.search}>
              <RiExternalLinkLine className="size-3.5" />
              {text("action.open")}
            </Link>
          </AlignButton.Root>
        )}
        {unread && (
          <AlignButton.Root
            size="xxsmall"
            variant="neutral"
            mode="ghost"
            className="gap-1 text-label-xs"
            isLoading={markingRead}
            icon={<RiCheckLine className="size-3.5" />}
            disabled={busy}
            onClick={() => onMarkRead(item.id)}
          >
            {text("action.markRead")}
          </AlignButton.Root>
        )}
        {item.archivedAt === null && (
          <AlignButton.Root
            size="xxsmall"
            variant="neutral"
            mode="ghost"
            className="gap-1 text-label-xs"
            isLoading={archiving}
            icon={<RiArchiveLine className="size-3.5" />}
            disabled={busy}
            onClick={() => onArchive(item.id)}
          >
            {text("action.archive")}
          </AlignButton.Root>
        )}
      </div>
    </li>
  );
}

function NotificationsPage() {
  const initialData = Route.useLoaderData();
  const { identity } = initialData;
  const { text } = useLocale("notifications");
  const scrollArea = useRef<HTMLDivElement>(null);
  const nextPage = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const queryClient = useQueryClient();
  const list = useInfiniteQuery(notificationsQuery(filter));

  const visibleRows = list.data?.pages.flatMap((page) => page.rows) ?? [];
  const counts = list.data?.pages[0]?.counts ?? initialData.counts;
  const { fetchNextPage, hasNextPage, isFetching, isFetchNextPageError } = list;

  useEffect(() => {
    const sentinel = nextPage.current;
    if (!sentinel || !hasNextPage || isFetching || isFetchNextPageError) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void fetchNextPage({ cancelRefetch: false });
      },
      { root: scrollArea.current, rootMargin: "0px 0px 160px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filter, fetchNextPage, hasNextPage, isFetching, isFetchNextPageError]);

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
  const mutationError = readMutation.isError || readAllMutation.isError || archiveMutation.isError;

  return (
    <>
      <AdminPageHeader
        title={text("title")}
        manager={canManageUsers(identity.role)}
        userName={identity.name}
        userImage={identity.image}
      />
      <div
        className="flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stroke-soft-200 px-3 py-1.5"
        aria-label="Notification filters"
      >
        <div className="flex items-center gap-1 overflow-x-auto">
          {notificationFilterSchema.options.map((value) => (
            <AlignButton.Root
              key={value}
              size="xxsmall"
              variant="neutral"
              mode={filter === value ? "lighter" : "ghost"}
              className="gap-2 text-label-xs"
              aria-pressed={filter === value}
              onClick={() => {
                setFilter(value);
                scrollArea.current?.scrollTo({ top: 0 });
              }}
            >
              <span>{text(`filter.${value}`)}</span>
              <span className="tabular-nums text-text-sub-600">{counts[value]}</span>
            </AlignButton.Root>
          ))}
        </div>
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          className="gap-1.5 text-label-xs"
          isLoading={readAllMutation.isPending}
          icon={<RiCheckDoubleLine className="size-3.5" />}
          disabled={busy || counts.unread === 0}
          onClick={() => readAllMutation.mutate()}
        >
          {text("action.markAllRead")}
        </AlignButton.Root>
      </div>
      <div ref={scrollArea} className="min-h-0 flex-1 overflow-y-auto">
        {((list.isError && !isFetchNextPageError) || mutationError) && (
          <div className="border-b border-stroke-soft-200 bg-error-lighter px-4 py-2.5">
            <Typography role="alert" variant="caption" className="text-error-base">
              {list.isError && !isFetchNextPageError ? text("error.load") : text("error.update")}
            </Typography>
          </div>
        )}
        {list.isPending ? (
          <div className="flex h-full min-h-64 items-center justify-center p-6">
            <Loading />
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <Typography variant="paragraph" className="text-text-sub-600">
              {text(`empty.${filter}`)}
            </Typography>
          </div>
        ) : (
          <ul>
            {visibleRows.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                busy={busy}
                markingRead={readMutation.isPending && readMutation.variables === item.id}
                archiving={archiveMutation.isPending && archiveMutation.variables === item.id}
                onMarkRead={(id) => readMutation.mutate(id)}
                onArchive={(id) => archiveMutation.mutate(id)}
              />
            ))}
          </ul>
        )}
        {hasNextPage && (
          <div ref={nextPage} className="flex justify-center px-4 py-4">
            {list.isFetchingNextPage ? (
              <SmallLoading label={text("status.loading")} />
            ) : isFetchNextPageError ? (
              <AlignButton.Root
                variant="neutral"
                mode="stroke"
                size="small"
                onClick={() => void fetchNextPage({ cancelRefetch: false })}
              >
                {text("action.retry")}
              </AlignButton.Root>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
