import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { canManageUsers } from "@g13/auth";
import { RiChatCheckLine, RiCloseLine, RiSearchLine } from "@remixicon/react";
import type { ModerateReviewInput } from "./-shared/moderation";
import { changeReviewVisibility } from "./-server/handler";
import { moderationReviewQuery, moderationReviewsQuery } from "./-client/queries";
import { reviewStatusSchema, type ReviewStatus } from "./-shared/schemas";
import { AlignButton } from "@/ui/button";
import { Loading } from "@/ui/loading";
import { Typography } from "@/ui/typography";
import { AdminPageHeader, DetailsToggleButton } from "../-components/AdminPageHeader";
import { AdminTableHeader } from "../-components/AdminTable";
import { AdminPagination } from "../-components/AdminPagination";
import { ConfirmationChange } from "../-components/ConfirmationChange";
import { DashboardEmptyState } from "../-components/DashboardEmptyState";
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
  pendingComponent: () => (
    <div className="flex flex-1 items-center justify-center p-6">
      <Loading tone="neutral" />
    </div>
  ),
  component: LecturerReviewsPage,
});

function LecturerReviewsPage() {
  const initialData = Route.useLoaderData();
  const { identity } = initialData;
  const { review: linkedReviewId } = Route.useSearch();
  const { detailsOpen, setDetailsOpen } = useAdminLayout();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<ReviewStatus>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(linkedReviewId ?? null);
  const [syncedLinkId, setSyncedLinkId] = useState(linkedReviewId);
  if (syncedLinkId !== linkedReviewId) {
    setSyncedLinkId(linkedReviewId);
    setSelectedId(linkedReviewId ?? null);
  }
  const [confirmation, setConfirmation] = useState<{
    input: ModerateReviewInput;
    label: string;
    status: "published" | "hidden";
  } | null>(null);
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

  return (
    <>
      <AdminPageHeader
        title="Lecturer reviews"
        manager={canManageUsers(identity.role)}
        userName={identity.name}
        userImage={identity.image}
      />
      <div
        className="flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stroke-soft-200 px-3 py-1.5"
        aria-label="Review status filters"
      >
        <div className="flex items-center gap-1 overflow-x-auto">
          {reviewStatusSchema.options.map((value) => (
            <AlignButton.Root
              key={value}
              size="xxsmall"
              variant="neutral"
              mode={status === value ? "lighter" : "ghost"}
              className="gap-2 text-label-xs"
              aria-pressed={status === value}
              onClick={() => {
                setStatus(value);
                setOffset(0);
                setSelectedId(null);
              }}
            >
              <span className="capitalize">{value === "all" ? "All reviews" : value}</span>
              <span className="text-text-sub-600 tabular-nums">{counts[value]}</span>
            </AlignButton.Root>
          ))}
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="relative flex flex-1 items-center sm:w-60">
            <RiSearchLine
              className="pointer-events-none absolute left-2.5 size-3.5 text-text-sub-600"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter lecturer, course, text…"
              aria-label="Filter reviews"
              className="h-7 w-full rounded-md border border-stroke-soft-200 bg-bg-white-0 pl-8 pr-7 text-paragraph-xs text-text-strong-950 placeholder:text-text-sub-600 focus:border-stroke-strong-950 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear filter"
                className="absolute right-1.5 inline-flex size-5 items-center justify-center rounded text-text-sub-600 hover:text-text-strong-950"
              >
                <RiCloseLine className="size-3.5" />
              </button>
            )}
          </label>
          <DetailsToggleButton
            available={!!selectedReview}
            visible={detailsVisible}
            onToggle={() => setDetailsOpen((open) => !open)}
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg-white-0">
          {!reviews.isPending && !reviews.isError && (
            <AdminPagination
              count={count}
              offset={needle ? 0 : offset}
              total={total}
              label="reviews"
              hasNext={!needle && reviewRows.length > 50}
              onPrevious={() => setOffset((current) => Math.max(0, current - 50))}
              onNext={() => setOffset((current) => current + 50)}
            />
          )}
          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-white-0 ${count === 0 ? "flex flex-col" : ""}`}
          >
            {reviews.isError ? (
              <Typography role="alert" className="p-4">
                Could not load reviews. Refresh or sign in again.
              </Typography>
            ) : reviews.isPending ? (
              <div className="flex h-full min-h-64 items-center justify-center p-6">
                <Loading tone="neutral" />
              </div>
            ) : (
              <>
                <AdminTableHeader
                  className={`hidden lg:sticky lg:top-0 lg:z-10 lg:grid ${reviewTableColumns}`}
                >
                  <span>Lecturer / course</span>
                  <span>Review</span>
                  <span>Rating</span>
                  <span className="text-right">Actions</span>
                </AdminTableHeader>
                {!count && (
                  <DashboardEmptyState
                    icon={<RiChatCheckLine />}
                    title={
                      needle
                        ? "No matching reviews"
                        : status === "all"
                          ? "No reviews yet"
                          : `No ${status} reviews`
                    }
                    description={
                      status === "all" && !needle ? "Submitted reviews appear here." : undefined
                    }
                    action={
                      needle || (status !== "all" && counts.all > 0) ? (
                        <AlignButton.Root
                          size="small"
                          variant="neutral"
                          mode="stroke"
                          onClick={() => {
                            if (needle) setQuery("");
                            else {
                              setStatus("all");
                              setOffset(0);
                              setSelectedId(null);
                            }
                          }}
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
                    selected={selectedReview?.id === review.id}
                    onSelect={() => {
                      setSelectedId(review.id);
                      setDetailsOpen(true);
                    }}
                    onAction={confirmReview}
                  />
                ))}
              </>
            )}
          </div>
        </div>
        <div
          inert={!detailsVisible}
          data-open={detailsVisible}
          className="hidden w-0 shrink-0 overflow-clip transition-[width] duration-200 ease-out data-[open=true]:w-[320px] xl:block motion-reduce:transition-none"
        >
          {selectedReview && !reviews.isPending && !reviews.isError && (
            <ReviewInspector
              key={selectedReview.id}
              review={selectedReview}
              onAction={confirmReview}
            />
          )}
        </div>
      </div>
      <ConfirmActionModal
        open={confirmation !== null}
        title={`Confirm ${confirmation?.input.action ?? ""}`}
        description={
          <>
            <strong className="text-text-strong-950">{confirmation?.label}</strong>.{" "}
            {confirmation?.input.action === "delete"
              ? "This removes the review from public listings and scores. The record stays stored and cannot be restored here."
              : confirmation?.input.action === "hide"
                ? "Remove this review from public listings and scores."
                : "Publish this review again and include it in public scores."}
          </>
        }
        confirmLabel={
          confirmation?.input.action === "delete"
            ? "Delete review"
            : confirmation?.input.action === "hide"
              ? "Hide review"
              : "Restore review"
        }
        error={mutation.isError ? "Update failed. Refresh and try again." : undefined}
        pending={mutation.isPending}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation) mutation.mutate(confirmation.input);
        }}
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
    </>
  );
}
