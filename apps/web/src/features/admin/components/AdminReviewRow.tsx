import { RiDeleteBinLine, RiEyeLine, RiEyeOffLine, RiLockLine } from "@remixicon/react";
import { AlignBadge } from "../../../ui/badge";
import { AlignButton } from "../../../ui/button";
import { AlignProgressBar } from "../../../ui/progress-bar";
import { Typography } from "../../../ui/typography";
import type { loadModerationReviews } from "../server/handler";
import type { ModerateReviewInput } from "../../lecturer-reviews/shared/moderation";
import { ReviewStatusBadge } from "./ReviewStatusBadge";

type Review = Awaited<ReturnType<typeof loadModerationReviews>>["rows"][number];

export function AdminReviewRow({
  review,
  selected,
  onSelect,
  onAction,
}: {
  review: Review;
  selected: boolean;
  onSelect: () => void;
  onAction: (input: ModerateReviewInput, label: string) => void;
}) {
  const deleted = review.deletedAt !== null;
  const hidden = review.status === "hidden";
  const label = `${review.lecturerName} · ${review.authorName}`;
  return (
    <article
      data-selected={selected}
      className="grid gap-3 border-b border-stroke-soft-200 px-4 py-3 transition-colors hover:bg-bg-weak-50/60 lg:grid-cols-[minmax(150px,0.9fr)_minmax(0,2fr)_184px_160px] lg:items-center lg:gap-4 xl:data-[selected=true]:bg-warning-lighter xl:data-[selected=true]:hover:bg-warning-lighter"
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5 lg:flex lg:flex-col lg:items-start lg:gap-1.5">
        <Typography as="h3" variant="label" className="min-w-0 font-semibold">
          <AlignButton.Root
            variant="neutral"
            mode="ghost"
            size="xxsmall"
            onClick={onSelect}
            className="hidden h-auto max-w-full justify-start truncate rounded-sm p-0 text-left text-label-sm text-text-strong-950 hover:bg-transparent hover:underline xl:block"
            aria-label={`Inspect ${label}`}
            aria-pressed={selected}
          >
            {review.lecturerName}
          </AlignButton.Root>
          <span className="xl:hidden">{review.lecturerName}</span>
        </Typography>
        <ReviewStatusBadge status={review.status} deleted={deleted} />
        <Typography variant="caption" className="col-span-2 text-text-sub-600">
          {review.courseCode} · {review.termLabel}
        </Typography>
      </div>
      <div className="min-w-0">
        <Typography className="whitespace-pre-wrap break-words text-[13px] leading-5 xl:line-clamp-2">
          {review.body}
        </Typography>
        <Typography variant="caption" className="mt-1.5 text-text-sub-600">
          {review.authorName} · {review.createdAt.toISOString().slice(0, 10)}
        </Typography>
      </div>
      <dl className="flex gap-4 text-paragraph-xs tabular-nums lg:mx-auto lg:block lg:w-fit lg:space-y-1 lg:border-r lg:border-stroke-soft-200 lg:pr-3">
        {[
          ["Clarity", review.clarity],
          ["Support", review.support],
          ["Organization", review.organization],
        ].map(([name, rating]) => (
          <div
            key={name}
            className="flex items-center gap-1.5 lg:grid lg:grid-cols-[76px_minmax(0,1fr)] lg:gap-2"
          >
            <dt className="text-text-strong-950">{name}</dt>
            <dd className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-right">
                {rating}
                <span className="text-text-sub-600">/5</span>
              </span>
              <AlignProgressBar.Root
                color="orange"
                value={Number(rating)}
                max={5}
                aria-label={`${name} rating`}
                className="hidden h-1.5 w-12 shrink-0 bg-text-disabled-300 lg:block"
              />
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex items-start justify-end gap-1.5 lg:items-center lg:justify-center">
        {!deleted && (
          <>
            <AlignButton.Root
              size="xsmall"
              variant="neutral"
              mode="ghost"
              className="w-20 gap-1 text-label-xs"
              onClick={() =>
                onAction({ reviewId: review.id, action: hidden ? "restore" : "hide" }, label)
              }
            >
              {hidden ? <RiEyeLine className="size-3.5" /> : <RiEyeOffLine className="size-3.5" />}
              {hidden ? "Restore" : "Hide"}
            </AlignButton.Root>
            <AlignButton.Root
              size="xsmall"
              variant="error"
              mode="ghost"
              className="w-18 gap-1 text-label-xs text-error-dark"
              onClick={() => onAction({ reviewId: review.id, action: "delete" }, label)}
            >
              <RiDeleteBinLine className="size-3.5" />
              Delete
            </AlignButton.Root>
          </>
        )}
        {deleted && (
          <AlignBadge.Root
            size="medium"
            variant="lighter"
            className="mt-1 gap-1 text-label-xs lg:mt-0"
          >
            <RiLockLine aria-hidden="true" className="size-3" />
            Read only
          </AlignBadge.Root>
        )}
      </div>
    </article>
  );
}
