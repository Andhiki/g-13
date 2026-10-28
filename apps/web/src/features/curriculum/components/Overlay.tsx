import { Typography } from "../../../ui/typography";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { RiCloseLine, RiFilter3Line } from "@remixicon/react";
import { AlignButton } from "../../../ui/button";
import { AlignDrawer } from "../../../ui/drawer";

const compactQuery = "(width < 1100px)";

function subscribeToCompactControls(onChange: () => void) {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

type FilterCopy = { title: string; description: string };
const defaultFilterCopy: FilterCopy = {
  title: "Filter kurikulum",
  description: "Pilih versi kurikulum dan kelompok mata kuliah.",
};

function FilterDrawer({ children, copy }: { children: ReactNode; copy: FilterCopy }) {
  return (
    <AlignDrawer.Root>
      <AlignDrawer.Trigger asChild>
        <AlignButton.Root
          variant="neutral"
          mode="stroke"
          size="medium"
          className="size-10 p-2.5"
          aria-label={`Buka ${copy.title.toLowerCase()}`}
        >
          <RiFilter3Line className="size-5" aria-hidden="true" />
        </AlignButton.Root>
      </AlignDrawer.Trigger>
      <AlignDrawer.Content side="bottom">
        <div className="flex items-start gap-3 p-5">
          <div className="min-w-0 flex-1">
            <AlignDrawer.Title asChild>
              <Typography as="h2" variant="label" className="text-text-strong-950">
                {copy.title}
              </Typography>
            </AlignDrawer.Title>
            <AlignDrawer.Description asChild>
              <Typography as="p" variant="caption" className="mt-1 text-text-sub-600">
                {copy.description}
              </Typography>
            </AlignDrawer.Description>
          </div>
          <AlignDrawer.Close asChild>
            <AlignButton.Root
              variant="neutral"
              mode="ghost"
              size="medium"
              className="size-10 shrink-0 p-2.5"
              aria-label={`Tutup ${copy.title.toLowerCase()}`}
            >
              <RiCloseLine className="size-5" aria-hidden="true" />
            </AlignButton.Root>
          </AlignDrawer.Close>
        </div>
        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-5 pb-5">{children}</div>
      </AlignDrawer.Content>
    </AlignDrawer.Root>
  );
}

function DesktopFilters({
  children,
  label,
  copy,
  toolbar = false,
}: {
  children: ReactNode;
  label: string;
  copy: FilterCopy;
  toolbar?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (event.target instanceof Element && event.target.closest('[role="listbox"]')) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      toggle.current?.focus();
    }
    window.addEventListener("keydown", closeOnEscape, true);
    return () => window.removeEventListener("keydown", closeOnEscape, true);
  }, [open]);

  return (
    <m.section
      initial={false}
      animate={{ width: open ? 300 : 40, height: open ? "auto" : 40, y: toolbar ? 0 : 52 }}
      transition={
        reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.45, bounce: 0.25 }
      }
      className="pointer-events-auto absolute right-0 top-0 z-20 overflow-hidden rounded-10 bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 max-[1100px]:hidden"
      aria-label={label}
    >
      <AlignButton.Root
        ref={toggle}
        variant="neutral"
        mode="ghost"
        size="medium"
        className="absolute right-0 top-0 z-10 size-10 p-2.5"
        aria-label={`${open ? "Tutup" : "Buka"} ${copy.title.toLowerCase()}`}
        aria-expanded={open}
        aria-controls="desktop-filters"
        onClick={() => setOpen(!open)}
      >
        {[
          { Icon: RiFilter3Line, name: "filter", active: !open },
          { Icon: RiCloseLine, name: "close", active: open },
        ].map(({ Icon, name, active }) => (
          <m.span
            key={name}
            initial={false}
            animate={{
              opacity: active ? 1 : 0,
              scale: active ? 1 : 0.25,
              filter: active ? "blur(0px)" : "blur(4px)",
            }}
            transition={
              reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0 }
            }
            className="absolute flex size-5 items-center justify-center"
            aria-hidden="true"
          >
            <Icon className="size-5" />
          </m.span>
        ))}
      </AlignButton.Root>
      <m.div
        id="desktop-filters"
        inert={!open}
        aria-hidden={!open}
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.1, delay: open && !reducedMotion ? 0.1 : 0 }}
        className="flex w-[300px] flex-col gap-3 p-4"
      >
        <Typography as="h2" variant="label" className="m-0 pr-8">
          Filter
        </Typography>
        {children}
      </m.div>
    </m.section>
  );
}

export function Overlay({
  navigation,
  search,
  viewControl,
  children,
  controlsLabel,
  home,
  filterCopy = defaultFilterCopy,
  filtersInToolbar = false,
}: {
  navigation: ReactNode;
  search: ReactNode;
  viewControl: ReactNode;
  children: ReactNode;
  controlsLabel: string;
  home?: ReactNode;
  filterCopy?: FilterCopy;
  filtersInToolbar?: boolean;
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
        className="pointer-events-none fixed inset-x-0 top-[var(--app-header-height)] z-[9] h-28 bg-linear-to-b from-bg-white-0 from-40% via-bg-white-0/90 via-60% to-transparent max-[1100px]:h-32"
      />
      <div className="pointer-events-none fixed inset-x-4 top-[calc(var(--app-header-height)+14px)] z-10 flex items-start text-text-strong-950 max-[1100px]:inset-x-3 max-[1100px]:top-[calc(var(--app-header-height)+12px)] max-[1100px]:flex-col max-[1100px]:gap-2">
        <div className="min-w-0 flex-1 basis-0 max-[1100px]:hidden">{home}</div>
        <div className="pointer-events-auto flex min-h-10 shrink-0 items-center justify-center max-[1100px]:order-2 max-[1100px]:w-full">
          {navigation}
        </div>
        <div className="relative flex min-w-0 flex-1 basis-0 flex-col items-end gap-3 max-[1100px]:contents">
          <div
            className={`flex min-h-10 items-center gap-2 transition-[width] duration-300 ease-out motion-reduce:transition-none max-[1100px]:order-1 max-[1100px]:w-full ${filtersInToolbar ? "w-[396px]" : "w-[348px]"}`}
          >
            {home && <div className="pointer-events-auto shrink-0 min-[1100px]:hidden">{home}</div>}
            <div className="pointer-events-auto min-w-0 flex-1 min-[1100px]:order-2">{search}</div>
            {filtersInToolbar && !compact && (
              <div className="order-3 size-10 shrink-0" aria-hidden="true" />
            )}
            <div className="pointer-events-auto size-10 shrink-0 min-[1100px]:hidden">
              {compact && <FilterDrawer copy={filterCopy}>{children}</FilterDrawer>}
            </div>
          </div>
          {!compact && (
            <DesktopFilters label={controlsLabel} copy={filterCopy} toolbar={filtersInToolbar}>
              {children}
            </DesktopFilters>
          )}
        </div>
      </div>
      <div className="fixed right-4 bottom-4 z-10 max-[1100px]:right-3 max-[1100px]:bottom-3">
        {viewControl}
      </div>
    </>
  );
}
