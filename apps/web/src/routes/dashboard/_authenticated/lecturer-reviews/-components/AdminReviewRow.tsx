import { RiDeleteBinLine, RiEyeLine, RiEyeOffLine, RiLockLine, RiStarFill } from "@remixicon/react";
import { AlignBadge } from "@/ui/badge";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import { formatAbsoluteTime, formatRelativeTime } from "../../notifications/-shared/time";
import type { loadModerationReviews } from "../-server/handler";
import type { ModerateReviewInput } from "../-shared/moderation";
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
  const { language } = useLocale("notifications");
  const deleted = review.deletedAt !== null;
  const hidden = review.status === "hidden";
  const label = `${review.lecturerName} · ${review.authorName}`;
  const overall = (review.clarity + review.support + review.organization) / 3;
  const createdMs = review.createdAt.getTime();

  return (
    // The whole row selects for pointer users; the name button keeps keyboard access.
    <article
      data-selected={selected}
      onClick={() => {
        if (!window.getSelection()?.toString()) onSelect();
      }}
      className="grid gap-3 xl:cursor-pointer border-b border-stroke-soft-200 px-4 py-3 transition-colors hover:bg-bg-weak-50/60 lg:grid-cols-[minmax(190px,1.05fr)_minmax(0,2fr)_104px_148px] lg:items-center lg:gap-4 xl:data-[selected=true]:bg-bg-weak-50 xl:data-[selected=true]:hover:bg-bg-weak-50"
    >
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Typography as="h3" variant="label" className="min-w-0 font-medium">
            <AlignButton.Root
              variant="neutral"
              mode="ghost"
              size="xxsmall"
              onClick={onSelect}
              className="hidden h-auto max-w-full truncate rounded-sm p-0 text-left text-label-sm text-text-strong-950 hover:bg-transparent hover:underline xl:block"
              aria-label={`Inspect ${label}`}
              aria-pressed={selected}
            >
              {review.lecturerName}
            </AlignButton.Root>
            <span className="block truncate xl:hidden">{review.lecturerName}</span>
          </Typography>
          <ReviewStatusBadge status={review.status} deleted={deleted} />
        </div>
        <Typography variant="caption" className="block truncate text-text-sub-600">
          {review.courseCode} · {review.termLabel}
        </Typography>
      </div>

      <div className="min-w-0">
        <Typography className="whitespace-pre-wrap break-words text-[13px] leading-5 text-text-strong-950 xl:line-clamp-2">
          {review.body}
        </Typography>
        <Typography variant="caption" className="mt-1 block text-text-sub-600">
          <span>{review.authorName}</span>
          <span title={formatAbsoluteTime(createdMs, language)}>
            {" "}
            · {formatRelativeTime(createdMs, language)}
          </span>
        </Typography>
      </div>

      <div
        className="flex items-center gap-1 text-label-sm text-text-strong-950 tabular-nums"
        title={`Clarity ${review.clarity}/5 · Support ${review.support}/5 · Organization ${review.organization}/5`}
      >
        <RiStarFill className="size-3.5 text-warning-base" aria-hidden="true" />
        <span>{overall.toFixed(1)}</span>
        <span className="font-normal text-text-sub-600">/ 5</span>
      </div>

      <div className="flex items-center justify-end gap-1">
        {!deleted && (
          <>
            <AlignButton.Root
              size="xxsmall"
              variant="neutral"
              mode="ghost"
              className="gap-1 text-label-xs"
              onClick={() =>
                onAction({ reviewId: review.id, action: hidden ? "restore" : "hide" }, label)
              }
            >
              {hidden ? <RiEyeLine className="size-3.5" /> : <RiEyeOffLine className="size-3.5" />}
              {hidden ? "Restore" : "Hide"}
            </AlignButton.Root>
            <AlignButton.Root
              size="xxsmall"
              variant="error"
              mode="ghost"
              className="gap-1 text-label-xs text-error-dark"
              onClick={() => onAction({ reviewId: review.id, action: "delete" }, label)}
            >
              <RiDeleteBinLine className="size-3.5" />
              Delete
            </AlignButton.Root>
          </>
        )}
        {deleted && (
          <AlignBadge.Root size="medium" variant="lighter" className="gap-1 text-label-xs">
            <RiLockLine aria-hidden="true" className="size-3" />
            Read only
          </AlignBadge.Root>
        )}
      </div>
    </article>
  );
}
