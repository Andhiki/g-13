import type { ReactNode } from "react";

type ControlSlot = "version" | "group";

const slotClasses: Record<ControlSlot, string> = {
  version: "flex min-w-0 flex-col max-[1100px]:order-2 max-[1100px]:block",
  group:
    "min-w-0 max-[1100px]:fixed max-[1100px]:top-[154px] max-[1100px]:left-[10px] max-[1100px]:w-[calc(100vw_-_20px)]",
};

export function OverlayControl({ slot, children }: { slot: ControlSlot; children: ReactNode }) {
  return <div className={slotClasses[slot]}>{children}</div>;
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
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[9] h-28 bg-linear-to-b from-bg-white-0 from-40% via-bg-white-0/90 via-60% to-transparent max-[1100px]:h-56"
      />
      <header className="pointer-events-none fixed inset-x-4 top-[14px] z-10 flex items-start text-text-strong-950 max-[1100px]:inset-x-[10px] max-[1100px]:top-[58px] max-[1100px]:items-center max-[1100px]:justify-end max-[1100px]:gap-2">
        <div className="min-w-0 flex-1 basis-0 max-[1100px]:hidden" aria-hidden="true" />
        <div className="pointer-events-auto flex min-h-10 shrink-0 items-center justify-center max-[1100px]:fixed max-[1100px]:inset-x-[10px] max-[1100px]:top-[106px]">
          {navigation}
        </div>
        <div className="flex min-w-0 flex-1 basis-0 flex-col items-end gap-3 max-[1100px]:contents">
          <div className="flex min-h-10 w-[348px] items-center gap-2 max-[1100px]:contents">
            <div className="pointer-events-auto shrink-0 max-[1100px]:order-3">{appearance}</div>
            <div className="pointer-events-auto min-w-0 flex-1 max-[1100px]:fixed max-[1100px]:top-[10px] max-[1100px]:left-[10px] max-[1100px]:w-[calc(100vw_-_20px)]">
              {search}
            </div>
          </div>
          <section
            className="pointer-events-auto flex w-[300px] flex-col gap-3 rounded-10 bg-bg-white-0 p-4 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 max-[1100px]:contents"
            aria-label={controlsLabel}
          >
            <h2 className="m-0 text-label-sm max-[1100px]:hidden">Filter</h2>
            {children}
          </section>
        </div>
      </header>
      <div className="fixed right-4 bottom-4 z-10 max-[1100px]:right-[10px] max-[1100px]:bottom-[10px]">
        {viewControl}
      </div>
    </>
  );
}
