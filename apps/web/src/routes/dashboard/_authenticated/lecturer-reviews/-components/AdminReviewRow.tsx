import { RiDeleteBinLine, RiEyeLine, RiEyeOffLine, RiStarFill } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { CourseChip } from "@/ui/course-chip";
import {
  AdminTableInspectButton,
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
  const hidden = review.status === "hidden";
  const label = `${review.lecturerName} · ${review.authorName}`;
  const overall = (review.clarity + review.support + review.organization) / 3;

  return (
    <AdminTableRow
      selected={selected}
      onSelect={onSelect}
      className={`${reviewTableColumns} lg:items-center`}
    >
      <div className="min-w-0 space-y-1">
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
        <CourseChip
          muted
          code={review.courseCode}
          name={language === "en" ? review.courseNameEn : review.courseNameId}
        />
        <Typography variant="caption" color="muted" className="block truncate">
          {review.termLabel}
        </Typography>
      </div>

      <div className="min-w-0">
        <Typography
          color="strong"
          className="whitespace-pre-wrap break-words text-[13px] xl:line-clamp-2"
        >
          {review.body}
        </Typography>
        <Typography variant="caption" color="muted" className="mt-1 block">
          {review.authorName}
        </Typography>
      </div>

      <div
        className="flex items-center gap-1 text-label-sm text-text-strong-950 tabular-nums"
        title={`Clarity ${review.clarity}/5 · Support ${review.support}/5 · Organization ${review.organization}/5`}
      >
        <RiStarFill className="size-3.5 text-warning-base" aria-hidden="true" />
        <span>{overall.toFixed(1)}</span>
      </div>

      {!deleted && (
        <div className="flex items-center justify-end gap-1">
          <AlignButton.Root
            size="xxsmall"
            variant="neutral"
            mode="ghost"
            compact
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
            compact
            onClick={() => onAction({ reviewId: review.id, action: "delete" }, label)}
          >
            <RiDeleteBinLine className="size-3.5" />
            Delete
          </AlignButton.Root>
        </div>
      )}
    </AdminTableRow>
  );
}
