import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";

export function AdminPagination({
  count,
  offset,
  total,
  label,
  hasNext,
  onPrevious,
  onNext,
}: {
  count: number;
  offset: number;
  total: number;
  label: string;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <footer className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-stroke-soft-200 bg-bg-white-0 px-4">
      <Typography variant="caption" className="text-text-sub-600 tabular-nums">
        {count ? `${offset + 1}–${offset + count} of ${total} ${label}` : "0 records"}
      </Typography>
      <div className="flex gap-1.5">
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          className="gap-1 text-label-xs disabled:text-text-sub-600"
          disabled={!offset}
          onClick={onPrevious}
        >
          <RiArrowLeftLine className="size-3.5" />
          Previous
        </AlignButton.Root>
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          className="gap-1 text-label-xs disabled:text-text-sub-600"
          disabled={!hasNext}
          onClick={onNext}
        >
          Next
          <RiArrowRightLine className="size-3.5" />
        </AlignButton.Root>
      </div>
    </footer>
  );
}
