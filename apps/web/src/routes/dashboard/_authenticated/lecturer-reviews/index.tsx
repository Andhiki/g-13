import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { canManageUsers } from "@g13/auth";
import { RiChatCheckLine } from "@remixicon/react";
import type { ModerateReviewInput } from "./-shared/moderation";
import { changeReviewVisibility } from "./-server/handler";
import { moderationReviewsQuery } from "./-client/queries";
import { reviewStatusSchema, type ReviewStatus } from "./-shared/schemas";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignModal } from "@/ui/modal";
import { Typography } from "@/ui/typography";
import { AdminPageHeader } from "../-components/AdminPageHeader";
import { AdminPagination } from "../-components/AdminPagination";
import { useAdminLayout } from "../-components/AdminLayoutContext";
import { AdminReviewRow } from "./-components/AdminReviewRow";
import { ReviewInspector } from "./-components/ReviewInspector";

export const Route = createFileRoute("/dashboard/_authenticated/lecturer-reviews/")({
  loader: async ({ context }) => {
    try {
      return await context.queryClient.fetchQuery(moderationReviewsQuery());
    } catch (error) {
      if (error instanceof Response && (error.status === 401 || error.status === 403))
        throw redirect({ to: "/dashboard/login" });
      throw error;
    }
  },
  component: LecturerReviewsPage,
});

function LecturerReviewsPage() {
  const { identity } = Route.useLoaderData();
  const { detailsOpen, setDetailsOpen } = useAdminLayout();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<ReviewStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    input: ModerateReviewInput;
    label: string;
  } | null>(null);
  const queryClient = useQueryClient();
  const reviews = useQuery(moderationReviewsQuery(offset, status));
  const reviewRows = reviews.data?.rows ?? [];
  const visibleRows = reviewRows.slice(0, 50);
  const count = visibleRows.length;
  const total = reviews.data?.counts[status] ?? 0;
  const selectedReview = visibleRows.find((review) => review.id === selectedId) ?? visibleRows[0];
  const detailsVisible = detailsOpen && !!selectedReview && !reviews.isPending && !reviews.isError;
  const mutation = useMutation({
    mutationFn: (input: ModerateReviewInput) => changeReviewVisibility({ data: input }),
    onSuccess: async () => {
      setConfirmation(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
        queryClient.invalidateQueries({ queryKey: ["lecturer-reviews"] }),
      ]);
    },
  });

  function confirmReview(input: ModerateReviewInput, label: string) {
    mutation.reset();
    setConfirmation({ input, label });
  }

  return (
    <>
      <AdminPageHeader
        title="Lecturer reviews"
        icon={<RiChatCheckLine className="hidden size-4 text-text-sub-600 md:block" />}
        manager={canManageUsers(identity.role)}
        userName={identity.name}
        detailsAvailable={!!selectedReview}
        detailsVisible={detailsVisible}
        isFetching={reviews.isFetching}
        onToggleDetails={() => setDetailsOpen((open) => !open)}
        onRefresh={() => void reviews.refetch()}
      />
      <div
        className="flex min-h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-stroke-soft-200 px-3 py-1.5"
        aria-label="Review status filters"
      >
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
            <span className="text-text-sub-600 tabular-nums">
              {reviews.data?.counts[value] ?? "—"}
            </span>
          </AlignButton.Root>
        ))}
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg-weak-50">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-white-0">
            {reviews.isError ? (
              <Typography role="alert" className="p-4">
                Unable to load protected data. Refresh or sign in again.
              </Typography>
            ) : reviews.isPending ? (
              <Typography role="status" className="p-4">
                Loading…
              </Typography>
            ) : (
              <>
                <div className="hidden grid-cols-[minmax(150px,0.9fr)_minmax(0,2fr)_184px_160px] gap-4 border-b border-stroke-soft-200 bg-bg-white-0 px-4 py-2 text-label-xs text-text-strong-950 lg:sticky lg:top-0 lg:z-10 lg:grid">
                  <span>Lecturer / course</span>
                  <span>Review</span>
                  <span className="text-center">Ratings</span>
                  <span className="text-center">Actions</span>
                </div>
                {!reviewRows.length && (
                  <div className="flex min-h-64 flex-col items-center justify-center gap-2 px-4">
                    <RiChatCheckLine className="size-7 text-text-sub-600" />
                    <Typography variant="labelSmall">
                      {status === "all" ? "No lecturer reviews yet" : `No ${status} reviews`}
                    </Typography>
                    <Typography variant="caption" className="text-text-sub-600">
                      {status === "all"
                        ? "New public reviews will appear here for moderation."
                        : "Choose another status to inspect other reviews."}
                    </Typography>
                  </div>
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
          {!reviews.isPending && !reviews.isError && (
            <AdminPagination
              count={count}
              offset={offset}
              total={total}
              label="reviews"
              hasNext={reviewRows.length > 50}
              onPrevious={() => setOffset((current) => current - 50)}
              onNext={() => setOffset((current) => current + 50)}
            />
          )}
        </div>
        {selectedReview && detailsVisible && (
          <ReviewInspector review={selectedReview} onAction={confirmReview} />
        )}
      </div>
      <AlignModal.Root
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setConfirmation(null);
        }}
      >
        <AlignModal.Content className="p-5">
          <AlignModal.Title>Confirm {confirmation?.input.action}</AlignModal.Title>
          <AlignModal.Description className="mt-2 pr-4">
            {confirmation?.label}.{" "}
            {confirmation?.input.action === "delete"
              ? "Soft deletion removes this review from public view and cannot be undone here. It does not erase stored data."
              : confirmation?.input.action === "hide"
                ? "Remove this review from public listings and scores."
                : "Publish this review again and include it in public scores."}
          </AlignModal.Description>
          {mutation.isError && (
            <Typography role="alert" className="mt-3 text-error-base">
              Change failed. Refresh and check your access before trying again.
            </Typography>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <AlignButton.Root
              size="small"
              variant="neutral"
              mode="stroke"
              disabled={mutation.isPending}
              onClick={() => setConfirmation(null)}
            >
              Cancel
            </AlignButton.Root>
            <AlignFancyButton.Root
              className="h-8 text-label-xs"
              disabled={mutation.isPending}
              onClick={() => {
                if (confirmation) mutation.mutate(confirmation.input);
              }}
            >
              {mutation.isPending ? "Saving…" : "Confirm"}
            </AlignFancyButton.Root>
          </div>
        </AlignModal.Content>
      </AlignModal.Root>
    </>
  );
}
