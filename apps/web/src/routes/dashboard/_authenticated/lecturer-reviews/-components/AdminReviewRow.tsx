import {
  RiCheckLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiEyeOffLine,
  RiStarFill,
} from "@remixicon/react";
import { CourseChip } from "@/ui/course-chip";
import {
  AdminTableAction,
  AdminTableInspectButton,
  AdminTableMeta,
  AdminTableRow,
} from "@/routes/dashboard/_authenticated/-components/AdminTable";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";
import type { loadModerationReviews } from "../-server/handler";
import type { ModerateReviewInput } from "../-shared/moderation";
import { ReviewStatusBadge } from "./ReviewStatusBadge";

export const reviewTableColumns = "lg:grid-cols-[minmax(190px,1.05fr)_minmax(0,2fr)_104px_148px]";

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
  const label = `${review.lecturerName} · ${review.authorName}`;
  const overall = (review.clarity + review.support + review.organization) / 3;
  const ratingDetails = `Clarity ${review.clarity}/5 · Support ${review.support}/5 · Organization ${review.organization}/5`;
  const courseName = language === "en" ? review.courseNameEn : review.courseNameId;

  return (
    <AdminTableRow
      selected={selected}
      onSelect={onSelect}
      className={`${reviewTableColumns} lg:items-center`}
    >
      <div className="min-w-0 lg:space-y-1">
        <div className="flex items-center gap-2">
          <AdminTableInspectButton
            ariaLabel={`Inspect ${label}`}
            selected={selected}
            onSelect={onSelect}
          >
            {review.lecturerName}
          </AdminTableInspectButton>
          <ReviewStatusBadge status={review.status} deleted={deleted} />
        </div>
        <ReviewMobileMeta
          review={review}
          courseName={courseName}
          overall={overall}
          ratingDetails={ratingDetails}
        />
        <div className="hidden lg:contents lg:[&>span]:mb-1">
          <CourseChip muted code={review.courseCode} name={courseName} />
          <Typography variant="caption" color="muted" className="block truncate">
            {review.termLabel}
          </Typography>
        </div>
      </div>

      <ReviewDesktopExcerpt review={review} />

      <div
        className="hidden items-center gap-1 text-label-sm text-text-strong-950 tabular-nums lg:flex"
        title={ratingDetails}
      >
        <RiStarFill className="size-3.5 text-warning-base" aria-hidden="true" />
        <span>{overall.toFixed(1)}</span>
      </div>

      {!deleted && <ReviewRowActions review={review} onAction={onAction} label={label} />}
    </AdminTableRow>
  );
}

function ReviewDesktopExcerpt({ review }: { review: Review }) {
  return (
    <div className="hidden min-w-0 lg:block">
      <Typography
        color="strong"
        className={
          // oxlint-disable-next-line shadcn/no-restyle -- moderation row body tuned to 13px alongside its two-line clamp; no label scale matches
          "whitespace-pre-wrap break-words text-[13px] xl:line-clamp-2"
        }
      >
        {review.body}
      </Typography>
      <Typography variant="caption" color="muted" className="mt-1 block">
        {review.authorName}
      </Typography>
    </div>
  );
}

function ReviewMobileMeta({
  review,
  courseName,
  overall,
  ratingDetails,
}: {
  review: Review;
  courseName: string;
  overall: number;
  ratingDetails: string;
}) {
  const excerpt = `${review.authorName} · ${review.body}`;
  return (
    <AdminTableMeta>
      <span
        className="inline-flex shrink-0 items-center gap-0.5 tabular-nums"
        title={ratingDetails}
      >
        <RiStarFill className="size-3 text-warning-base" aria-hidden="true" />
        {overall.toFixed(1)}
      </span>
      <span className="shrink-0 font-mono" title={`${courseName} · ${review.termLabel}`}>
        {review.courseCode}
      </span>
      <span className="truncate" title={excerpt}>
        · {excerpt}
      </span>
    </AdminTableMeta>
  );
}

function ReviewRowActions({
  review,
  onAction,
  label,
}: {
  review: Review;
  onAction: (input: ModerateReviewInput, label: string) => void;
  label: string;
}) {
  const pending = review.status === "pending";
  const hidden = review.status === "hidden";
  const VisibilityIcon = hidden ? RiEyeLine : RiEyeOffLine;
  return (
    <div className="hidden items-center justify-end gap-1 lg:flex">
      {pending ? (
        <>
          <AdminTableAction
            label="Approve"
            variant="primary"
            onClick={() => onAction({ reviewId: review.id, action: "approve" }, label)}
          >
            <RiCheckLine aria-hidden="true" className="size-3.5" />
          </AdminTableAction>
          <AdminTableAction
            label="Hide"
            variant="neutral"
            onClick={() => onAction({ reviewId: review.id, action: "hide" }, label)}
          >
            <RiEyeOffLine aria-hidden="true" className="size-3.5" />
          </AdminTableAction>
        </>
      ) : (
        <>
          <AdminTableAction
            label={hidden ? "Restore" : "Hide"}
            onClick={() =>
              onAction({ reviewId: review.id, action: hidden ? "restore" : "hide" }, label)
            }
          >
            <VisibilityIcon aria-hidden="true" className="size-3.5" />
          </AdminTableAction>
          <AdminTableAction
            label="Delete"
            variant="error"
            onClick={() => onAction({ reviewId: review.id, action: "delete" }, label)}
          >
            <RiDeleteBinLine aria-hidden="true" className="size-3.5" />
          </AdminTableAction>
        </>
      )}
    </div>
  );
}
