import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { animate, m, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  RiArchiveLine,
  RiCheckDoubleLine,
  RiCheckLine,
  RiExternalLinkLine,
  RiNotification3Line,
} from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import { AdminFilterBar } from "../-components/AdminFilterBar";
import { AdminPageHeader } from "../-components/AdminPageHeader";
import { DashboardEmptyState } from "../-components/DashboardEmptyState";
import { DashboardPending, DashboardRoutePending } from "../-components/DashboardPending";
import { SmallLoading } from "@/ui/small-loading";
import { notificationsQuery } from "./-client/queries";
import { useNotificationActions } from "./-client/useNotificationActions";
import { usePendingNotificationReadIds } from "./-client/usePendingNotificationReads";
import type { NotificationItem } from "./-server/repository";
import {
  getNotificationPresentation,
  notificationFilterSchema,
  type NotificationFilter,
} from "./-shared/schemas";
import { formatAbsoluteTime, formatRelativeTime } from "@/date-format";

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
  pendingComponent: DashboardRoutePending,
  component: NotificationsPage,
});

const coarsePointerQuery = "(pointer: coarse)";

function subscribeCoarsePointer(onChange: () => void) {
  const query = window.matchMedia(coarsePointerQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function NotificationRowActions({
  itemId,
  archived,
  unread,
  linkTarget,
  busy,
  archiving,
  onMarkRead,
  onArchive,
}: {
  itemId: string;
  archived: boolean;
  unread: boolean;
  linkTarget: ReturnType<typeof getNotificationPresentation>["linkTarget"];
  busy: boolean;
  archiving: boolean;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const { text } = useLocale("notifications");
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      {linkTarget && (
        <AlignButton.Root asChild size="xxsmall" variant="neutral" mode="stroke" compact>
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
          compact
          icon={<RiCheckLine className="size-3.5" />}
          disabled={busy}
          onClick={() => onMarkRead(itemId)}
        >
          {text("action.markRead")}
        </AlignButton.Root>
      )}
      {!archived && (
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          compact
          isLoading={archiving}
          icon={<RiArchiveLine className="size-3.5" />}
          disabled={busy}
          onClick={() => onArchive(itemId)}
        >
          {text("action.archive")}
        </AlignButton.Root>
      )}
    </div>
  );
}

function NotificationRowContent({
  unread,
  title,
  body,
  createdAt,
}: {
  unread: boolean;
  title: string;
  body: string;
  createdAt: number;
}) {
  const { text, language } = useLocale("notifications");
  return (
    <div className="min-w-0 flex-1 space-y-0.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {unread && (
          <span
            className="inline-block size-2 shrink-0 rounded-full bg-primary-base"
            aria-label={text("status.unread")}
          />
        )}
        <Typography as="p" variant="label" color="strong">
          {title}
        </Typography>
        <Typography variant="caption" color="muted" title={formatAbsoluteTime(createdAt, language)}>
          · {formatRelativeTime(createdAt, language)}
        </Typography>
      </div>
      <Typography variant="paragraph" color="muted">
        {body}
      </Typography>
    </div>
  );
}

function NotificationRow({
  item,
  busy,
  optimisticallyRead,
  archiving,
  onMarkRead,
  onArchive,
}: {
  item: NotificationItem;
  busy: boolean;
  optimisticallyRead: boolean;
  archiving: boolean;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const { text } = useLocale("notifications");
  const { titleKey, bodyKey, interpolation, linkTarget } = getNotificationPresentation(item);
  const unread = !optimisticallyRead && item.readAt === null && item.archivedAt === null;
  const reducedMotion = useReducedMotion();
  const coarsePointer = useSyncExternalStore(
    subscribeCoarsePointer,
    () => window.matchMedia(coarsePointerQuery).matches,
    () => false,
  );
  const canSwipe = item.archivedAt === null && !busy && !reducedMotion && coarsePointer;
  const swipeX = useMotionValue(0);
  const revealOpacity = useTransform(swipeX, [-96, -24, 0], [1, 0.65, 0]);

  useEffect(() => {
    if (!archiving) {
      animate(swipeX, 0, { type: "spring", stiffness: 500, damping: 35 });
    }
  }, [archiving, swipeX]);

  return (
    <li className="relative overflow-hidden border-b border-stroke-soft-200">
      {item.archivedAt === null && (
        <m.div
          aria-hidden="true"
          style={{ opacity: revealOpacity }}
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-1.5 bg-bg-strong-950 px-4 text-label-xs text-text-white-0"
        >
          <RiArchiveLine className="size-4" />
          {text("action.archive")}
        </m.div>
      )}
      <m.div
        style={canSwipe ? { x: swipeX } : undefined}
        drag={canSwipe ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.2, right: 0.05 }}
        dragSnapToOrigin
        onDragEnd={(_, info) => {
          if (!busy && (info.offset.x <= -72 || info.velocity.x <= -450)) {
            onArchive(item.id);
          }
        }}
        className={`relative z-10 flex touch-pan-y items-start justify-between gap-3 px-4 py-3 ${
          unread ? "bg-bg-weak-50/70" : "bg-bg-white-0"
        }`}
      >
        <NotificationRowContent
          unread={unread}
          title={text(titleKey, interpolation)}
          body={text(bodyKey, interpolation)}
          createdAt={item.createdAt}
        />
        <NotificationRowActions
          itemId={item.id}
          archived={item.archivedAt !== null}
          unread={unread}
          linkTarget={linkTarget}
          busy={busy}
          archiving={archiving}
          onMarkRead={onMarkRead}
          onArchive={onArchive}
        />
      </m.div>
    </li>
  );
}

const EMPTY_NOTIFICATION_ICONS = {
  archived: <RiArchiveLine className="size-5" />,
  unread: <RiCheckDoubleLine className="size-5" />,
  all: <RiNotification3Line className="size-5" />,
} as const;

function NotificationsFeed({
  isPending,
  isFetchingNextPage,
  isFetchNextPageError,
  hasNextPage,
  hasInitialRows,
  filter,
  displayedRows,
  pendingReadIdSet,
  isBusy,
  isArchiving,
  nextPageRef,
  onViewAll,
  onMarkRead,
  onArchive,
  onRetryNextPage,
}: {
  isPending: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  hasNextPage: boolean;
  hasInitialRows: boolean;
  filter: NotificationFilter;
  displayedRows: NotificationItem[];
  pendingReadIdSet: Set<string>;
  isBusy: (id: string) => boolean;
  isArchiving: (id: string) => boolean;
  nextPageRef: React.RefObject<HTMLDivElement | null>;
  onViewAll: () => void;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onRetryNextPage: () => void;
}) {
  const { text } = useLocale("notifications");
  if (isPending) return <DashboardPending />;
  if (displayedRows.length === 0) {
    return (
      <DashboardEmptyState
        icon={EMPTY_NOTIFICATION_ICONS[filter]}
        title={text(`empty.${filter}.title`)}
        description={text(`empty.${filter}.contextDescription`)}
        action={
          filter !== "all" && hasInitialRows ? (
            <AlignButton.Root size="small" variant="neutral" mode="stroke" onClick={onViewAll}>
              {text("action.viewAll")}
            </AlignButton.Root>
          ) : undefined
        }
      />
    );
  }

  return (
    <>
      <ul>
        {displayedRows.map((item) => (
          <NotificationRow
            key={item.id}
            item={item}
            busy={isBusy(item.id)}
            optimisticallyRead={pendingReadIdSet.has(item.id)}
            archiving={isArchiving(item.id)}
            onMarkRead={onMarkRead}
            onArchive={onArchive}
          />
        ))}
      </ul>
      {hasNextPage && (
        <div ref={nextPageRef} className="flex justify-center px-4 py-4">
          {isFetchingNextPage ? (
            <SmallLoading label={text("status.loading")} />
          ) : isFetchNextPageError ? (
            <AlignButton.Root
              variant="neutral"
              mode="stroke"
              size="small"
              onClick={onRetryNextPage}
            >
              {text("action.retry")}
            </AlignButton.Root>
          ) : null}
        </div>
      )}
    </>
  );
}

function NotificationsPage() {
  const initialData = Route.useLoaderData();
  const { text } = useLocale("notifications");
  const scrollArea = useRef<HTMLDivElement>(null);
  const nextPage = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const list = useInfiniteQuery(notificationsQuery(filter));
  const pendingReadIdSet = usePendingNotificationReadIds();

  const visibleRows = list.data?.pages.flatMap((page) => page.rows) ?? [];
  const displayedRows =
    filter === "unread"
      ? visibleRows.filter((item) => !pendingReadIdSet.has(item.id))
      : visibleRows;
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

  const { readMutation, readAllMutation, archiveMutation, isBusy, isArchiving } =
    useNotificationActions();
  const mutationError = readMutation.isError || readAllMutation.isError || archiveMutation.isError;
  const errorMessage =
    list.isError && !isFetchNextPageError ? text("error.load") : text("error.update");
  const handleViewAll = () => {
    setFilter("all");
    scrollArea.current?.scrollTo({ top: 0 });
  };

  return (
    <>
      <AdminPageHeader title={text("title")} />
      <AdminFilterBar
        ariaLabel="Notification filters"
        tabs={notificationFilterSchema.options.map((value) => ({
          value,
          label: text(`filter.${value}`),
        }))}
        activeTab={filter}
        onTabChange={(value) => {
          setFilter(value);
          scrollArea.current?.scrollTo({ top: 0 });
        }}
      >
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          compact
          isLoading={readAllMutation.isPending}
          icon={<RiCheckDoubleLine className="size-3.5" />}
          disabled={readAllMutation.isPending}
          onClick={() => readAllMutation.mutate()}
        >
          {text("action.markAllRead")}
        </AlignButton.Root>
      </AdminFilterBar>
      <div
        ref={scrollArea}
        className={`min-h-0 flex-1 overflow-y-auto ${displayedRows.length === 0 ? "flex flex-col" : ""}`}
      >
        {((list.isError && !isFetchNextPageError) || mutationError) && (
          <div className="border-b border-stroke-soft-200 bg-error-lighter px-4 py-2.5">
            <Typography role="alert" variant="caption" color="danger">
              {errorMessage}
            </Typography>
          </div>
        )}
        <NotificationsFeed
          isPending={list.isPending}
          isFetchingNextPage={list.isFetchingNextPage}
          isFetchNextPageError={isFetchNextPageError}
          hasNextPage={Boolean(hasNextPage)}
          hasInitialRows={initialData.rows.length > 0}
          filter={filter}
          displayedRows={displayedRows}
          pendingReadIdSet={pendingReadIdSet}
          isBusy={isBusy}
          isArchiving={isArchiving}
          nextPageRef={nextPage}
          onViewAll={handleViewAll}
          onMarkRead={(id) => readMutation.mutate(id)}
          onArchive={(id) => archiveMutation.mutate(id)}
          onRetryNextPage={() => void fetchNextPage({ cancelRefetch: false })}
        />
      </div>
    </>
  );
}
