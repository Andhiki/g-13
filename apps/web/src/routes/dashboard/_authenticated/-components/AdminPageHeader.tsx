import { RiLayoutRightLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";
import { MobileModerationMenu } from "./ModerationNavigation";

export function AdminPageHeader({
  title,
  manager,
  userName,
  detailsAvailable = false,
  detailsVisible = false,
  onToggleDetails,
}: {
  title: string;
  manager: boolean;
  userName: string;
  detailsAvailable?: boolean;
  detailsVisible?: boolean;
  onToggleDetails?: () => void;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-stroke-soft-200 px-3">
      <div className="flex min-w-0 items-center gap-2">
        <MobileModerationMenu manager={manager} userName={userName} />
        {onToggleDetails && (
          <AlignButton.Root
            size="xsmall"
            variant="neutral"
            mode="ghost"
            className="hidden size-7 shrink-0 px-0 aria-expanded:bg-bg-weak-50 xl:inline-flex"
            disabled={!detailsAvailable}
            aria-label={detailsVisible ? "Hide details" : "Show details"}
            title={detailsVisible ? "Hide details" : "Show details"}
            aria-expanded={detailsVisible}
            aria-controls="moderation-inspector"
            onClick={onToggleDetails}
          >
            <RiLayoutRightLine className="size-4 text-text-sub-600" />
          </AlignButton.Root>
        )}
        <Typography as="h1" variant="label" className="truncate px-1">
          {title}
        </Typography>
      </div>
    </header>
  );
}
