import { useState } from "react";
import { RiThumbUpFill, RiThumbUpLine } from "@remixicon/react";
import { useLocale } from "../../useLocale";
import { Typography } from "../../ui/typography";
import { courseDisplayName } from "./course-search";
import { RatingStars } from "./LecturerReviewCard";

type Reviews =
  Awaited<ReturnType<typeof import("./repository").getLecturerDetail>> extends infer Detail
    ? NonNullable<Detail> extends { reviews: infer Rows }
      ? Rows
      : never
    : never;

export function ReviewList({
  reviews,
  language,
  likedReviews,
  canLike,
  onLike,
}: {
  reviews: Reviews;
  language: "id" | "en";
  likedReviews: string[];
  canLike: boolean;
  onLike: (reviewId: string, liked: boolean) => Promise<void>;
}) {
  const { text } = useLocale("lecturers");
  if (!reviews.length) {
    return (
      <div className="rounded-10 border border-dashed border-stroke-soft-200 px-6 py-10 text-center">
        <Typography as="p" variant="paragraph" className="m-0 text-text-sub-600">
          {text("No reviews yet. Be the first to share your experience.")}
        </Typography>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <article
          key={review.id}
          id={`review-${review.id}`}
          className="rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <Typography as="strong" variant="label">
              {review.authorName.toLowerCase() === "anonymous"
                ? text("Anonymous")
                : review.authorName}
            </Typography>
            <Typography as="time" variant="caption" className="text-text-sub-600">
              {review.termLabel}
            </Typography>
          </div>
          <Typography as="p" variant="caption" className="mb-0 mt-1 text-text-sub-600">
            {courseDisplayName(review, language)} · {review.code}
          </Typography>
          <Typography
            as="p"
            variant="paragraph"
            className="mb-0 mt-3 whitespace-pre-wrap break-words leading-relaxed"
          >
            {review.body}
          </Typography>
          <dl className="mb-0 mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {(
              [
                ["Clarity", review.clarity],
                ["Support", review.support],
                ["Organization", review.organization],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex min-w-0 items-center gap-2">
                <Typography as="dt" variant="caption" className="text-text-sub-600">
                  {text(label)}
                </Typography>
                <dd className="m-0">
                  <RatingStars value={value} label={`${text(label)}: ${value}/5`} />
                </dd>
              </div>
            ))}
          </dl>
          <ReviewLikeButton
            reviewId={review.id}
            count={review.likeCount}
            liked={likedReviews.includes(review.id)}
            canLike={canLike}
            onLike={onLike}
          />
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
  onLike,
}: {
  reviewId: string;
  count: number;
  liked: boolean;
  canLike: boolean;
  onLike: (reviewId: string, liked: boolean) => Promise<void>;
}) {
  const { text } = useLocale("lecturers");
  const [pending, setPending] = useState(false);
  const Icon = liked ? RiThumbUpFill : RiThumbUpLine;
  return (
    <button
      type="button"
      className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-label-sm text-text-sub-600 hover:text-text-strong-950 focus-visible:outline-2 focus-visible:outline-primary-base disabled:opacity-50"
      aria-pressed={liked}
      aria-label={text(liked ? "Unlike review" : "Like review")}
      disabled={!canLike || pending}
      onClick={async () => {
        setPending(true);
        try {
          await onLike(reviewId, !liked);
        } finally {
          setPending(false);
        }
      }}
    >
      <Icon className="size-4" aria-hidden="true" />
      <Typography as="span" variant="label">
        {count}
      </Typography>
    </button>
  );
}
