import type { ReactNode } from "react";
import { RiStarFill, RiThumbUpFill, RiThumbUpLine } from "@remixicon/react";
import { useLocale } from "@/useLocale";
import { AlignButton } from "@/ui/button";
import { CourseChip } from "@/ui/course-chip";
import { Typography } from "@/ui/typography";
import type { lecturerDetailQueryOptions } from "../-client/queries";
import { courseDisplayName } from "../-shared/course-search";

type Review = Awaited<
  ReturnType<NonNullable<ReturnType<typeof lecturerDetailQueryOptions>["queryFn"]>>
>["reviews"][number];

export function ReviewList({
  reviews,
  language,
  emptyState,
  likedReviews,
  canLike,
  likePending,
  onLike,
}: {
  reviews: Review[];
  language: "id" | "en";
  emptyState: ReactNode;
  likedReviews: string[];
  canLike: boolean;
  likePending: boolean;
  onLike: (reviewId: string, liked: boolean) => Promise<void>;
}) {
  const { text } = useLocale("lecturers");
  if (!reviews.length) {
    return emptyState;
  }
  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <article
          key={review.id}
          id={`review-${review.id}`}
          className="rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-4 sm:p-5"
        >
          <Typography as="p" className="m-0 whitespace-pre-wrap break-words leading-relaxed">
            {review.body}
          </Typography>
          <div className="mt-3">
            <CourseChip code={review.code} name={courseDisplayName(review, language)} />
          </div>
          <dl className="mb-0 mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {(
              [
                ["Clarity", review.clarity],
                ["Support", review.support],
                ["Organization", review.organization],
              ] satisfies [string, number][]
            ).map(([label, value]) => (
              <div key={label} className="flex items-center gap-1.5">
                <Typography as="dt" variant="caption" className="text-text-sub-600">
                  {text(label)}
                </Typography>
                <dd className="m-0 flex items-center gap-0.5 text-label-xs tabular-nums">
                  {value}
                  <RiStarFill aria-hidden="true" className="size-3.5 text-primary-base" />
                </dd>
              </div>
            ))}
          </dl>
          <footer className="mt-4 flex items-center justify-between gap-3 border-t border-stroke-soft-200 pt-3">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              <Typography as="span" variant="labelSmall" className="min-w-0 wrap-anywhere">
                {review.authorName.toLowerCase() === "anonymous"
                  ? text("Anonymous")
                  : review.authorName}
              </Typography>
              <Typography as="time" variant="caption" className="text-text-sub-600">
                {review.termLabel}
              </Typography>
            </div>
            <ReviewLikeButton
              reviewId={review.id}
              count={review.likeCount}
              liked={likedReviews.includes(review.id)}
              canLike={canLike}
              pending={likePending}
              onLike={onLike}
            />
          </footer>
        </article>
      ))}
    </div>
  );
}

function ReviewLikeButton({
  reviewId,
  count,
  liked,
  canLike,
  pending,
  onLike,
}: {
  reviewId: string;
  count: number;
  liked: boolean;
  canLike: boolean;
  pending: boolean;
  onLike: (reviewId: string, liked: boolean) => Promise<void>;
}) {
  const { text } = useLocale("lecturers");
  const Icon = liked ? RiThumbUpFill : RiThumbUpLine;
  return (
    <AlignButton.Root
      size="xsmall"
      variant="neutral"
      mode="stroke"
      className="min-w-9 shrink-0 gap-1.5 px-2 tabular-nums"
      aria-pressed={liked}
      aria-label={text(liked ? "Unlike review" : "Like review")}
      disabled={!canLike || pending}
      onClick={() => onLike(reviewId, !liked)}
    >
      <Icon className="size-4" aria-hidden="true" />
      {count}
    </AlignButton.Root>
  );
}
