import { useSyncExternalStore, type ReactNode } from "react";
import { AlignModal } from "@/ui/modal";

export const desktopInspectorQuery = "(min-width: 80rem)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(desktopInspectorQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function AdminInspector({
  title,
  desktopOpen,
  mobileOpen,
  onMobileOpenChange,
  children,
}: {
  title: string;
  desktopOpen: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const desktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(desktopInspectorQuery).matches,
    () => true,
  );

  if (!desktop) {
    return (
      <AlignModal.Root open={mobileOpen && !!children} onOpenChange={onMobileOpenChange}>
        <AlignModal.Content
          overlayClassName="items-stretch justify-end p-0"
          className="h-[min(85dvh,40rem)] max-w-none overflow-hidden rounded-b-none pb-[env(safe-area-inset-bottom)] [&>aside]:w-full [&>aside]:border-0"
          aria-describedby={undefined}
        >
          <AlignModal.Title className="sr-only">{title}</AlignModal.Title>
          {children}
        </AlignModal.Content>
      </AlignModal.Root>
    );
  }

  return (
    <div
      inert={!desktopOpen}
      data-open={desktopOpen}
      className="w-0 shrink-0 overflow-clip transition-[width] duration-200 ease-out data-[open=true]:w-[320px] motion-reduce:transition-none"
    >
      {children}
    </div>
  );
}
