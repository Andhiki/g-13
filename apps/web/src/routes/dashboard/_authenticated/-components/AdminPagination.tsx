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
      <Typography variant="caption" color="muted" className="tabular-nums">
        {count ? `${offset + 1}–${offset + count} of ${total} ${label}` : `0 ${label}`}
      </Typography>
      <div className="flex gap-1.5">
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          steady
          disabled={!offset}
          onClick={onPrevious}
        >
          Previous
        </AlignButton.Root>
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          steady
          disabled={!hasNext}
          onClick={onNext}
        >
          Next
        </AlignButton.Root>
      </div>
    </footer>
  );
}
