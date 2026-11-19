import type { ReactNode } from "react";
import { RiLayoutRightLine, RiRefreshLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";
import { MobileModerationMenu } from "./ModerationNavigation";

export function AdminPageHeader({
  title,
  icon,
  manager,
  userName,
  detailsAvailable,
  detailsVisible,
  isFetching,
  onToggleDetails,
  onRefresh,
}: {
  title: string;
  icon: ReactNode;
  manager: boolean;
  userName: string;
  detailsAvailable: boolean;
  detailsVisible: boolean;
  isFetching: boolean;
  onToggleDetails: () => void;
  onRefresh: () => void;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-stroke-soft-200 px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <MobileModerationMenu manager={manager} userName={userName} />
        {icon}
        <Typography as="h1" variant="label" className="truncate">
          {title}
        </Typography>
      </div>
      <div className="flex items-center gap-1">
        <AlignButton.Root
          size="xsmall"
          variant="neutral"
          mode="ghost"
          className="hidden w-8 px-0 aria-expanded:bg-bg-weak-50 xl:inline-flex"
          disabled={!detailsAvailable}
          aria-label={detailsVisible ? "Hide details" : "Show details"}
          title={detailsVisible ? "Hide details" : "Show details"}
          aria-expanded={detailsVisible}
          aria-controls="moderation-inspector"
          onClick={onToggleDetails}
        >
          <RiLayoutRightLine className="size-4" />
        </AlignButton.Root>
        <AlignButton.Root
          size="xsmall"
          variant="neutral"
          mode="ghost"
          className="gap-1.5 text-label-xs"
          disabled={isFetching}
          onClick={onRefresh}
        >
          <RiRefreshLine className="size-3.5" />
          Refresh
        </AlignButton.Root>
      </div>
    </header>
  );
}
