import { RiLayoutLeftLine, RiLayoutRightLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";
import { useAdminLayout } from "./AdminLayoutContext";
import { MobileModerationMenu } from "./ModerationNavigation";

export function AdminPageHeader({
  title,
  manager,
  userName,
}: {
  title: string;
  manager: boolean;
  userName: string;
}) {
  const { sidebarOpen, setSidebarOpen } = useAdminLayout();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-stroke-soft-200 px-3">
      <div className="flex min-w-0 items-center gap-2">
        <MobileModerationMenu manager={manager} userName={userName} />
        <AlignButton.Root
          size="xsmall"
          variant="neutral"
          mode="ghost"
          className="hidden size-7 shrink-0 px-0 aria-expanded:bg-bg-weak-50 md:inline-flex"
          aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          aria-expanded={sidebarOpen}
          aria-controls="moderation-sidebar"
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <RiLayoutLeftLine className="size-4 text-text-sub-600" />
        </AlignButton.Root>
        <Typography as="h1" variant="label" className="truncate px-1">
          {title}
        </Typography>
      </div>
    </header>
  );
}

export function DetailsToggleButton({
  available,
  visible,
  onToggle,
}: {
  available: boolean;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <AlignButton.Root
      size="xsmall"
      variant="neutral"
      mode="ghost"
      className="hidden size-7 shrink-0 px-0 aria-expanded:bg-bg-weak-50 xl:inline-flex"
      disabled={!available}
      aria-label={visible ? "Hide details" : "Show details"}
      title={visible ? "Hide details" : "Show details"}
      aria-expanded={visible}
      aria-controls="moderation-inspector"
      onClick={onToggle}
    >
      <RiLayoutRightLine className="size-4 text-text-sub-600" />
    </AlignButton.Root>
  );
}
