import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { canManageUsers } from "@g13/auth";
import { RiChatCheckLine } from "@remixicon/react";
import type { ModerateReviewInput } from "./-shared/moderation";
import { changeReviewVisibility, type loadModerationReviews } from "./-server/handler";
import { moderationReviewQuery, moderationReviewsQuery } from "./-client/queries";
import { reviewStatusSchema, type ReviewStatus } from "./-shared/schemas";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";
import { AdminFilterBar, AdminSearchInput } from "../-components/AdminFilterBar";
import { AdminInspector, desktopInspectorQuery } from "../-components/AdminInspector";
import { AdminPageHeader, DetailsToggleButton } from "../-components/AdminPageHeader";
import { AdminTableHeader } from "../-components/AdminTable";
import { AdminPagination } from "../-components/AdminPagination";
import { ConfirmationChange } from "../-components/ConfirmationChange";
import { DashboardEmptyState } from "../-components/DashboardEmptyState";
import { DashboardPending, DashboardRoutePending } from "../-components/DashboardPending";
import { ConfirmActionModal } from "../-components/ConfirmActionModal";
import { useAdminLayout } from "../-components/AdminLayoutContext";
import { AdminReviewRow, reviewTableColumns } from "./-components/AdminReviewRow";
import { ReviewStatusBadge } from "./-components/ReviewStatusBadge";
import { ReviewInspector } from "./-components/ReviewInspector";

const reviewsSearchSchema = z.object({
  review: z.string().optional(),
});

export const Route = createFileRoute("/dashboard/_authenticated/lecturer-reviews/")({
  validateSearch: reviewsSearchSchema,
  loader: async ({ context }) => {
    try {
      return await context.queryClient.fetchQuery(moderationReviewsQuery());
    } catch (error) {
      if (error instanceof Response && (error.status === 401 || error.status === 403))
        throw redirect({ to: "/dashboard/login" });
      throw error;
    }
  },
  pendingComponent: DashboardRoutePending,
  component: LecturerReviewsPage,
});

type ModerationReview = Awaited<ReturnType<typeof loadModerationReviews>>["rows"][number];
type ReviewConfirmation = {
  input: ModerateReviewInput;
  label: string;
  status: "published" | "hidden";
};

function reviewEmptyTitle(needle: string, status: ReviewStatus): string {
  if (needle) return "No matching reviews";
  if (status === "all") return "No reviews yet";
  return `No ${status} reviews`;
}

function reviewEmptyDescription(needle: string, status: ReviewStatus): string {
  if (needle) return "Try another search term or clear the search to see submitted reviews.";
  if (status === "all") {
    return "Reviews submitted from public lecturer pages appear here immediately; they are not held for admin approval.";
  }
  if (status === "published") {
    return "New public submissions are published immediately and will appear here once visitors post them.";
  }
  return `Reviews appear here after an admin moves them to ${status}.`;
}

function ReviewsListBody({
  reviewsState,
  visibleRows,
  needle,
  status,
  allCount,
  selectedReviewId,
  onClearSearch,
  onViewAll,
  onSelectReview,
  onAction,
}: {
  reviewsState: { isError: boolean; isPending: boolean };
  visibleRows: ModerationReview[];
  needle: string;
  status: ReviewStatus;
  allCount: number;
  selectedReviewId?: string;
  onClearSearch: () => void;
  onViewAll: () => void;
  onSelectReview: (id: string) => void;
  onAction: (input: ModerateReviewInput, label: string) => void;
}) {
  if (reviewsState.isError) {
    return (
      <div className="p-4">
        <Typography role="alert">Could not load reviews. Refresh or sign in again.</Typography>
      </div>
    );
  }
  if (reviewsState.isPending) return <DashboardPending />;
  const showReset = Boolean(needle) || (status !== "all" && allCount > 0);
  return (
    <>
      <AdminTableHeader
        className={`hidden lg:sticky lg:top-0 lg:z-10 lg:grid ${reviewTableColumns}`}
      >
        <span>Lecturer / course</span>
        <span>Review</span>
        <span>Rating</span>
        <span className="text-right">Actions</span>
      </AdminTableHeader>
      {visibleRows.length === 0 && (
        <DashboardEmptyState
          icon={<RiChatCheckLine />}
          title={reviewEmptyTitle(needle, status)}
          description={reviewEmptyDescription(needle, status)}
          action={
            showReset ? (
              <AlignButton.Root
                size="small"
                variant="neutral"
                mode="stroke"
                onClick={needle ? onClearSearch : onViewAll}
              >
                {needle ? "Clear search" : "View all reviews"}
              </AlignButton.Root>
            ) : undefined
          }
        />
      )}
      {visibleRows.map((review) => (
        <AdminReviewRow
          key={review.id}
          review={review}
          selected={selectedReviewId === review.id}
          onSelect={() => onSelectReview(review.id)}
          onAction={onAction}
        />
      ))}
    </>
  );
}

const REVIEW_ACTION_LABELS: Record<ModerateReviewInput["action"], string> = {
  delete: "Delete review",
  hide: "Hide review",
  restore: "Restore review",
};

const REVIEW_ACTION_SUMMARIES: Record<ModerateReviewInput["action"], string> = {
  delete:
    "This removes the review from public listings and scores. The record stays stored and cannot be restored here.",
  hide: "Remove this review from public listings and scores.",
  restore: "Publish this review again and include it in public scores.",
};

function ReviewConfirmModal({
  confirmation,
  isError,
  isPending,
  onClose,
  onConfirm,
}: {
  confirmation: ReviewConfirmation | null;
  isError: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const action = confirmation?.input.action ?? "restore";
  const actionSummary = REVIEW_ACTION_SUMMARIES[action];
  const confirmLabel = REVIEW_ACTION_LABELS[action];

  return (
    <ConfirmActionModal
      open={confirmation !== null}
      destructive={action === "delete"}
      title={`Confirm ${confirmation?.input.action ?? ""}`}
      description={
        <span>
          <strong className="text-text-strong-950">{confirmation?.label}</strong>. {actionSummary}
        </span>
      }
      confirmLabel={confirmLabel}
      error={isError ? "Update failed. Refresh and try again." : undefined}
      pending={isPending}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      {confirmation && (
        <ConfirmationChange
          from={<ReviewStatusBadge status={confirmation.status} deleted={false} />}
          to={
            <ReviewStatusBadge
              status={confirmation.input.action === "restore" ? "published" : "hidden"}
              deleted={confirmation.input.action === "delete"}
            />
          }
        />
      )}
    </ConfirmActionModal>
  );
}

function ReviewsContent({
  reviewsState,
  visibleRows,
  count,
  offset,
  total,
  hasNext,
  needle,
  status,
  allCount,
  selectedReview,
  detailsVisible,
  mobileDetailsOpen,
  onMobileDetailsOpenChange,
  onPreviousPage,
  onNextPage,
  onClearSearch,
  onViewAll,
  onSelectReview,
  onAction,
}: {
  reviewsState: { isError: boolean; isPending: boolean };
  visibleRows: ModerationReview[];
  count: number;
  offset: number;
  total: number;
  hasNext: boolean;
  needle: string;
  status: ReviewStatus;
  allCount: number;
  selectedReview: ModerationReview | undefined;
  detailsVisible: boolean;
  mobileDetailsOpen: boolean;
  onMobileDetailsOpenChange: (open: boolean) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onClearSearch: () => void;
  onViewAll: () => void;
  onSelectReview: (id: string) => void;
  onAction: (input: ModerateReviewInput, label: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg-white-0">
        {!reviewsState.isPending && !reviewsState.isError && (
          <AdminPagination
            count={count}
            offset={needle ? 0 : offset}
            total={total}
            label="reviews"
            hasNext={hasNext}
            onPrevious={onPreviousPage}
            onNext={onNextPage}
          />
        )}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-white-0 ${count === 0 ? "flex flex-col" : ""}`}
        >
          <ReviewsListBody
            reviewsState={reviewsState}
            visibleRows={visibleRows}
            needle={needle}
            status={status}
            allCount={allCount}
            selectedReviewId={selectedReview?.id}
            onClearSearch={onClearSearch}
            onViewAll={onViewAll}
            onSelectReview={onSelectReview}
            onAction={onAction}
          />
        </div>
      </div>
      <AdminInspector
        title="Review details"
        desktopOpen={detailsVisible}
        mobileOpen={mobileDetailsOpen}
        onMobileOpenChange={onMobileDetailsOpenChange}
      >
        {selectedReview && !reviewsState.isPending && !reviewsState.isError && (
          <ReviewInspector key={selectedReview.id} review={selectedReview} onAction={onAction} />
        )}
      </AdminInspector>
    </div>
  );
}

function LecturerReviewsPage() {
  const initialData = Route.useLoaderData();
  const { identity } = initialData;
  const { review: linkedReviewId } = Route.useSearch();
  const { detailsOpen, setDetailsOpen } = useAdminLayout();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<ReviewStatus>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(linkedReviewId ?? null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(!!linkedReviewId);
  const [syncedLinkId, setSyncedLinkId] = useState(linkedReviewId);
  if (syncedLinkId !== linkedReviewId) {
    setSyncedLinkId(linkedReviewId);
    setMobileDetailsOpen(!!linkedReviewId);
    setSelectedId(linkedReviewId ?? null);
  }
  const [confirmation, setConfirmation] = useState<ReviewConfirmation | null>(null);
  const queryClient = useQueryClient();
  const reviews = useQuery(moderationReviewsQuery(offset, status));
  const counts = reviews.data?.counts ?? initialData.counts;
  const reviewRows = reviews.data?.rows ?? [];
  const pageRows = reviewRows.slice(0, 50);
  const needle = query.trim().toLowerCase();
  const visibleRows = needle
    ? pageRows.filter((row) =>
        `${row.lecturerName} ${row.courseCode} ${row.courseNameId} ${row.courseNameEn} ${row.termLabel} ${row.authorName} ${row.body}`
          .toLowerCase()
          .includes(needle),
      )
    : pageRows;
  const count = visibleRows.length;
  const total = needle ? visibleRows.length : counts[status];
  // A notification can link to a review outside the loaded page; load it directly rather
  // than falling back to an unrelated row the moderator might act on by mistake.
  const linkedOffPage =
    selectedId !== null &&
    selectedId === linkedReviewId &&
    reviews.isSuccess &&
    !pageRows.some((review) => review.id === selectedId);
  const linkedReview = useQuery({
    ...moderationReviewQuery(selectedId ?? ""),
    enabled: linkedOffPage,
  });
  const selectedReview = linkedOffPage
    ? (linkedReview.data ?? undefined)
    : (visibleRows.find((review) => review.id === selectedId) ?? visibleRows[0]);
  const detailsVisible = detailsOpen && !!selectedReview && !reviews.isPending && !reviews.isError;
  const mutation = useMutation({
    mutationFn: (input: ModerateReviewInput) => changeReviewVisibility({ data: input }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
        queryClient.invalidateQueries({ queryKey: ["lecturer-reviews"] }),
      ]);
      setConfirmation(null);
    },
  });

  function confirmReview(input: ModerateReviewInput, label: string) {
    const review =
      selectedReview?.id === input.reviewId
        ? selectedReview
        : pageRows.find(({ id }) => id === input.reviewId);
    if (!review) return;
    mutation.reset();
    setConfirmation({ input, label, status: review.status });
  }

  const searchAndDetails = (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <AdminSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Filter lecturer, course, text…"
        ariaLabel="Filter reviews"
      />
      <DetailsToggleButton
        available={!!selectedReview}
        visible={detailsVisible}
        onToggle={() => setDetailsOpen((open) => !open)}
      />
    </div>
  );

  return (
    <>
      <AdminPageHeader
        title="Lecturer reviews"
        manager={canManageUsers(identity.role)}
        userName={identity.name}
        userEmail={identity.email}
        userImage={identity.image}
      />
      <AdminFilterBar
        ariaLabel="Review status filters"
        tabs={reviewStatusSchema.options.map((value) => ({
          value,
          label: value === "all" ? "All reviews" : value,
          count: counts[value],
        }))}
        activeTab={status}
        tabLabelClassName="capitalize"
        onTabChange={(value) => {
          setStatus(value);
          setOffset(0);
          setSelectedId(null);
        }}
      >
        {searchAndDetails}
      </AdminFilterBar>
      <ReviewsContent
        reviewsState={reviews}
        visibleRows={visibleRows}
        count={count}
        offset={offset}
        total={total}
        hasNext={!needle && reviewRows.length > 50}
        needle={needle}
        status={status}
        allCount={counts.all}
        selectedReview={selectedReview}
        detailsVisible={detailsVisible}
        mobileDetailsOpen={mobileDetailsOpen}
        onMobileDetailsOpenChange={setMobileDetailsOpen}
        onPreviousPage={() => setOffset((current) => Math.max(0, current - 50))}
        onNextPage={() => setOffset((current) => current + 50)}
        onClearSearch={() => setQuery("")}
        onViewAll={() => {
          setStatus("all");
          setOffset(0);
          setSelectedId(null);
        }}
        onSelectReview={(id) => {
          setSelectedId(id);
          setDetailsOpen(true);
          setMobileDetailsOpen(!window.matchMedia(desktopInspectorQuery).matches);
        }}
        onAction={confirmReview}
      />
      <ReviewConfirmModal
        confirmation={confirmation}
        isError={mutation.isError}
        isPending={mutation.isPending}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation) mutation.mutate(confirmation.input);
        }}
      />
    </>
  );
}
