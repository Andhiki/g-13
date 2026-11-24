import { useEffect, useRef, useState } from "react";
import { RiDeleteBinLine, RiEyeLine, RiEyeOffLine, RiLockLine } from "@remixicon/react";
import {
  AdminInspectorMeta,
  AdminInspectorMetaRow,
  AdminInspectorPanel,
} from "@/routes/dashboard/_authenticated/-components/AdminInspector";
import { AlignButton } from "@/ui/button";
import { RatingStars } from "@/ui/rating-stars";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import { formatAbsoluteTime, formatRelativeTime } from "@/date-format";
import type { loadModerationReviews } from "../-server/handler";
import type { ModerateReviewInput } from "../-shared/moderation";
import { ReviewStatusBadge } from "./ReviewStatusBadge";

type Review = Awaited<ReturnType<typeof loadModerationReviews>>["rows"][number];

function ReviewInspectorFooter({
  deleted,
  hidden,
  reviewId,
  label,
  onAction,
}: {
  deleted: boolean;
  hidden: boolean;
  reviewId: string;
  label: string;
  onAction: (input: ModerateReviewInput, label: string) => void;
}) {
  if (deleted) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-1">
        <RiLockLine className="size-3.5" />
        <Typography variant="caption" color="muted">
          Read only
        </Typography>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      <AlignButton.Root
        size="small"
        variant="neutral"
        mode="stroke"
        compact
        className="w-full"
        onClick={() => onAction({ reviewId, action: hidden ? "restore" : "hide" }, label)}
      >
        {hidden ? <RiEyeLine className="size-3.5" /> : <RiEyeOffLine className="size-3.5" />}
        {hidden ? "Restore" : "Hide"}
      </AlignButton.Root>
      <AlignButton.Root
        size="small"
        variant="error"
        mode="lighter"
        compact
        className="w-full"
        onClick={() => onAction({ reviewId, action: "delete" }, label)}
      >
        <RiDeleteBinLine className="size-3.5" />
        Delete
      </AlignButton.Root>
    </div>
  );
}

function ReviewRatingsSection({
  overall,
  clarity,
  support,
  organization,
}: {
  overall: number;
  clarity: number;
  support: number;
  organization: number;
}) {
  const aspects = [
    ["Clarity", clarity],
    ["Support", support],
    ["Organization", organization],
  ] as const;

  return (
    <section className="border-t border-stroke-soft-200 pt-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Typography as="h3" variant="labelSmall">
          Ratings
        </Typography>
        <div className="flex items-center gap-2">
          <RatingStars
            value={overall}
            size="sm"
            label={`Overall rating: ${overall.toFixed(1)} of 5`}
          />
          <Typography variant="labelSmall" className="tabular-nums">
            {overall.toFixed(1)}
          </Typography>
        </div>
      </div>
      <dl className="space-y-2.5">
        {aspects.map(([name, value]) => (
          <div key={name} className="flex items-center justify-between gap-2 text-paragraph-xs">
            <dt className="text-text-sub-600">{name}</dt>
            <dd className="flex items-center gap-2 tabular-nums">
              <RatingStars value={value} size="xs" label={`${name} rating: ${value} of 5`} />
              <span className="w-4 text-right text-text-sub-600">{value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ReviewInspector({
  review,
  onAction,
}: {
  review: Review;
  onAction: (input: ModerateReviewInput, label: string) => void;
}) {
  const { language } = useLocale("notifications");
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const deleted = review.deletedAt !== null;
  const hidden = review.status === "hidden";
  const label = `${review.lecturerName} · ${review.authorName}`;
  const overall = (review.clarity + review.support + review.organization) / 3;
  const createdMs = review.createdAt.getTime();

  useEffect(() => {
    const element = bodyRef.current;
    if (!element || expanded) return;
    const measure = () => {
      setCanExpand(element.scrollHeight > element.clientHeight + 1);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [review.body, expanded]);

  const bodyClassName =
    // oxlint-disable-next-line shadcn/no-restyle -- inspector review body runs tighter than caption's default leading for the clamp layout
    `mt-2 whitespace-pre-wrap break-words leading-5 ${expanded ? "" : "line-clamp-3"}`;

  return (
    <AdminInspectorPanel
      title="Review details"
      ariaLabel="Selected review details"
      footer={
        <ReviewInspectorFooter
          deleted={deleted}
          hidden={hidden}
          reviewId={review.id}
          label={label}
          onAction={onAction}
        />
      }
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <Typography as="h2" variant="label" className="min-w-0">
            {review.lecturerName}
          </Typography>
          <ReviewStatusBadge status={review.status} deleted={deleted} />
        </div>
        <Typography variant="caption" color="muted" className="mt-1 block">
          {review.courseCode} · {review.termLabel}
        </Typography>
      </div>
      <AdminInspectorMeta>
        <AdminInspectorMetaRow label="Author" valueClassName="break-words">
          {review.authorName}
        </AdminInspectorMetaRow>
        <AdminInspectorMetaRow label="Published" title={formatAbsoluteTime(createdMs, language)}>
          {formatRelativeTime(createdMs, language)}
        </AdminInspectorMetaRow>
      </AdminInspectorMeta>
      <ReviewRatingsSection
        overall={overall}
        clarity={review.clarity}
        support={review.support}
        organization={review.organization}
      />
      <section className="border-t border-stroke-soft-200 pt-4">
        <Typography as="h3" variant="labelSmall" color="strong">
          Experience
        </Typography>
        <Typography ref={bodyRef} variant="caption" color="muted" className={bodyClassName}>
          {review.body}
        </Typography>
        {(canExpand || expanded) && (
          <AlignButton.Root
            size="xxsmall"
            variant="neutral"
            mode="ghost"
            className={
              // oxlint-disable-next-line shadcn/no-restyle -- inline show-more/less toggle: h-6 px-1.5 keeps it a text-height continuation of the clamped body
              "-ml-1.5 mt-1.5 h-6 px-1.5"
            }
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "Show less" : "Show more"}
          </AlignButton.Root>
        )}
      </section>
    </AdminInspectorPanel>
  );
}
