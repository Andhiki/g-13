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

function ReviewAspectRatings({ review }: { review: Review }) {
  const { text } = useLocale("lecturers");
  const scores: [string, number][] = [
    ["Clarity", review.clarity],
    ["Support", review.support],
    ["Organization", review.organization],
  ];
  return (
    <dl className="mb-0 mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {scores.map(([label, value]) => (
        <div key={label} className="flex items-center gap-1.5">
          <Typography as="dt" variant="caption" color="muted">
            {text(label)}
          </Typography>
          <dd className="m-0 flex items-center gap-0.5 text-label-xs tabular-nums">
            {value}
            <RiStarFill aria-hidden="true" className="size-3.5 text-primary-base" />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ReviewCard({
  review,
  language,
  liked,
  canLike,
  likePending,
  onLike,
}: {
  review: Review;
  language: "id" | "en";
  liked: boolean;
  canLike: boolean;
  likePending: boolean;
  onLike: (reviewId: string, liked: boolean) => Promise<void>;
}) {
  const { text } = useLocale("lecturers");
  return (
    <article key={review.id} id={`review-${review.id}`} className="min-w-0 py-3 sm:py-4">
      <Typography
        as="p"
        className={
          // oxlint-disable-next-line shadcn/no-restyle -- public review body reads best relaxed; the paragraph label scale runs tighter than prose wants
          "m-0 whitespace-pre-wrap break-words leading-relaxed"
        }
      >
        {review.body}
      </Typography>
      <div className="mt-2">
        <CourseChip code={review.code} name={courseDisplayName(review, language)} />
      </div>
      <ReviewAspectRatings review={review} />
      <footer className="mt-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          <Typography as="span" variant="labelSmall" className="min-w-0 wrap-anywhere">
            {review.authorName.toLowerCase() === "anonymous"
              ? text("Anonymous")
              : review.authorName}
          </Typography>
          <Typography as="time" variant="caption" color="muted">
            {review.termLabel}
          </Typography>
        </div>
        <ReviewLikeButton
          reviewId={review.id}
          count={review.likeCount}
          liked={liked}
          canLike={canLike}
          pending={likePending}
          onLike={onLike}
        />
      </footer>
    </article>
  );
}

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
  if (!reviews.length) {
    return emptyState;
  }
  return (
    <div className="divide-y divide-stroke-soft-200 border-y border-stroke-soft-200">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          language={language}
          liked={likedReviews.includes(review.id)}
          canLike={canLike}
          likePending={likePending}
          onLike={onLike}
        />
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
      compact
      className={
        // oxlint-disable-next-line shadcn/no-restyle -- the like count uses tabular numerals so digits do not shift as the count changes
        "min-w-9 shrink-0 tabular-nums"
      }
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
