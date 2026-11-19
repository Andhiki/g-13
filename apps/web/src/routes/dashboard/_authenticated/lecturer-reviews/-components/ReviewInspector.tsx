import {
  RiChatCheckLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLockLine,
} from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { AlignProgressBar } from "@/ui/progress-bar";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import { formatAbsoluteTime, formatRelativeTime } from "../../notifications/-shared/time";
import type { loadModerationReviews } from "../-server/handler";
import type { ModerateReviewInput } from "../-shared/moderation";
import { ReviewStatusBadge } from "./ReviewStatusBadge";

type Review = Awaited<ReturnType<typeof loadModerationReviews>>["rows"][number];

export function ReviewInspector({
  review,
  onAction,
}: {
  review: Review;
  onAction: (input: ModerateReviewInput, label: string) => void;
}) {
  const { language } = useLocale("notifications");
  const deleted = review.deletedAt !== null;
  const hidden = review.status === "hidden";
  const label = `${review.lecturerName} · ${review.authorName}`;
  const overall = (review.clarity + review.support + review.organization) / 3;
  const createdMs = review.createdAt.getTime();

  return (
    <aside
      id="moderation-inspector"
      aria-label="Selected review details"
      className="hidden w-[320px] shrink-0 flex-col overflow-hidden border-l border-stroke-soft-200 bg-bg-white-0 xl:flex"
    >
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-stroke-soft-200 px-4 text-label-xs">
        <RiChatCheckLine className="size-3.5 text-text-sub-600" />
        Review details
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-5 p-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <Typography as="h2" variant="label" className="min-w-0">
                {review.lecturerName}
              </Typography>
              <ReviewStatusBadge status={review.status} deleted={deleted} />
            </div>
            <Typography variant="caption" className="mt-1 block text-text-sub-600">
              {review.courseCode} · {review.termLabel}
            </Typography>
          </div>
          <dl className="space-y-2.5 text-paragraph-xs">
            <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
              <dt className="text-text-sub-600">Author</dt>
              <dd className="break-words">{review.authorName}</dd>
            </div>
            <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
              <dt className="text-text-sub-600">Published</dt>
              <dd title={formatAbsoluteTime(createdMs, language)}>
                {formatRelativeTime(createdMs, language)}
              </dd>
            </div>
          </dl>
          <section className="border-t border-stroke-soft-200 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <Typography as="h3" variant="labelSmall">
                Ratings
              </Typography>
              <Typography variant="labelSmall" className="tabular-nums">
                {overall.toFixed(1)}
                <span className="font-normal text-text-sub-600"> / 5 overall</span>
              </Typography>
            </div>
            <dl className="space-y-3">
              {[
                ["Clarity", review.clarity],
                ["Support", review.support],
                ["Organization", review.organization],
              ].map(([name, value]) => (
                <div key={name}>
                  <div className="mb-1.5 flex justify-between text-paragraph-xs">
                    <dt className="text-text-sub-600">{name}</dt>
                    <dd className="tabular-nums">{value}/5</dd>
                  </div>
                  <AlignProgressBar.Root
                    color="orange"
                    value={Number(value)}
                    max={5}
                    aria-label={`${name} rating`}
                    className="h-1"
                  />
                </div>
              ))}
            </dl>
          </section>
          <section className="border-t border-stroke-soft-200 pt-4">
            <Typography as="h3" variant="labelSmall">
              Experience
            </Typography>
            <Typography className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-5">
              {review.body}
            </Typography>
          </section>
        </div>
      </div>
      <section className="shrink-0 border-t border-stroke-soft-200 p-3">
        {!deleted ? (
          <div className="grid grid-cols-2 gap-2">
            <AlignButton.Root
              size="small"
              variant="neutral"
              mode="stroke"
              className="w-full gap-1.5 text-label-xs"
              onClick={() =>
                onAction({ reviewId: review.id, action: hidden ? "restore" : "hide" }, label)
              }
            >
              {hidden ? <RiEyeLine className="size-3.5" /> : <RiEyeOffLine className="size-3.5" />}
              {hidden ? "Restore" : "Hide"}
            </AlignButton.Root>
            <AlignButton.Root
              size="small"
              variant="error"
              mode="lighter"
              className="w-full gap-1.5 text-label-xs"
              onClick={() => onAction({ reviewId: review.id, action: "delete" }, label)}
            >
              <RiDeleteBinLine className="size-3.5" />
              Delete
            </AlignButton.Root>
          </div>
        ) : (
          <Typography
            variant="caption"
            className="flex items-center justify-center gap-1.5 py-1 text-text-sub-600"
          >
            <RiLockLine className="size-3.5" />
            Read only
          </Typography>
        )}
      </section>
    </aside>
  );
}
