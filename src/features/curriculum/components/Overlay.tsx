import { useSyncExternalStore, type ReactNode } from "react";
import { RiFilter3Line } from "@remixicon/react";
import { AlignButton } from "../../../ui/button";
import { AlignDrawer } from "../../../ui/drawer";

const compactQuery = "(width < 1100px)";

function subscribeToCompactControls(onChange: () => void) {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function FilterDrawer({ children }: { children: ReactNode }) {
  return (
    <AlignDrawer.Root>
      <AlignDrawer.Trigger asChild>
        <AlignButton.Root
          variant="neutral"
          mode="stroke"
          size="medium"
          className="size-10 p-2.5"
          aria-label="Buka filter kurikulum"
        >
          <RiFilter3Line className="size-5" aria-hidden="true" />
        </AlignButton.Root>
      </AlignDrawer.Trigger>
      <AlignDrawer.Content side="bottom">
        <div className="p-5">
          <AlignDrawer.Title className="text-label-sm text-text-strong-950">
            Filter kurikulum
          </AlignDrawer.Title>
          <AlignDrawer.Description className="mt-1 text-paragraph-xs text-text-sub-600">
            Pilih versi kurikulum dan kelompok mata kuliah.
          </AlignDrawer.Description>
        </div>
        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-5 pb-5">{children}</div>
        <div className="grid border-t border-stroke-soft-200 p-5">
          <AlignDrawer.Close asChild>
            <AlignButton.Root variant="neutral" mode="filled" size="medium">
              Tampilkan mata kuliah
            </AlignButton.Root>
          </AlignDrawer.Close>
        </div>
      </AlignDrawer.Content>
    </AlignDrawer.Root>
  );
}

export function Overlay({
  navigation,
  appearance,
  search,
  viewControl,
  children,
  controlsLabel,
}: {
  navigation: ReactNode;
  appearance: ReactNode;
  search: ReactNode;
  viewControl: ReactNode;
  children: ReactNode;
  controlsLabel: string;
}) {
  const compact = useSyncExternalStore(
    subscribeToCompactControls,
    () => window.matchMedia(compactQuery).matches,
    () => false,
  );

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[9] h-28 bg-linear-to-b from-bg-white-0 from-40% via-bg-white-0/90 via-60% to-transparent max-[1100px]:h-32"
      />
      <header className="pointer-events-none fixed inset-x-4 top-[14px] z-10 flex items-start text-text-strong-950 max-[1100px]:inset-x-3 max-[1100px]:top-3 max-[1100px]:flex-col max-[1100px]:gap-2">
        <div className="min-w-0 flex-1 basis-0 max-[1100px]:hidden" aria-hidden="true" />
        <div className="pointer-events-auto flex min-h-10 shrink-0 items-center justify-center max-[1100px]:order-2 max-[1100px]:w-full">
          {navigation}
        </div>
        <div className="flex min-w-0 flex-1 basis-0 flex-col items-end gap-3 max-[1100px]:contents">
          <div className="flex min-h-10 w-[348px] items-center gap-2 max-[1100px]:order-1 max-[1100px]:w-full">
            <div className="pointer-events-auto min-w-0 flex-1">{search}</div>
            <div className="pointer-events-auto shrink-0">{appearance}</div>
            <div className="pointer-events-auto size-10 shrink-0 min-[1100px]:hidden">
              {compact && <FilterDrawer>{children}</FilterDrawer>}
            </div>
          </div>
          {!compact && (
            <section
              className="pointer-events-auto flex w-[300px] flex-col gap-3 rounded-10 bg-bg-white-0 p-4 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 max-[1100px]:hidden"
              aria-label={controlsLabel}
            >
              <h2 className="m-0 text-label-sm">Filter</h2>
              {children}
            </section>
          )}
        </div>
      </header>
      <div className="fixed right-4 bottom-4 z-10 max-[1100px]:right-3 max-[1100px]:bottom-3">
        {viewControl}
      </div>
    </>
  );
}
