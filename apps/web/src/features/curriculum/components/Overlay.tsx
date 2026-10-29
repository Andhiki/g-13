import { useLocale } from "../../../useLocale";
import { Typography } from "../../../ui/typography";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { RiCloseLine, RiFilter3Line } from "@remixicon/react";
import { AlignButton } from "../../../ui/button";
import { AlignDrawer } from "../../../ui/drawer";
import { useKeyboardShortcuts } from "../../../ui/use-keyboard-shortcuts";

const compactQuery = "(width < 1100px)";

function subscribeToCompactControls(onChange: () => void) {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

type FilterCopy = { title: string; description: string };
const defaultFilterCopy: FilterCopy = {
  title: "Filter kurikulum",
  description: "Pilih versi kurikulum.",
};

function FilterDrawer({
  children,
  copy,
  open,
  onOpenChange,
}: {
  children: ReactNode;
  copy: FilterCopy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { text, language } = useLocale();
  return (
    <AlignDrawer.Root open={open} onOpenChange={onOpenChange}>
      <AlignDrawer.Trigger asChild>
        <AlignButton.Root
          variant="neutral"
          mode="stroke"
          size="medium"
          className="size-10 p-2.5"
          aria-label={text(open ? "closeFilter" : "openFilter", {
            name: text(copy.title).toLocaleLowerCase(language),
          })}
          aria-expanded={open}
          aria-keyshortcuts="F"
        >
          <RiFilter3Line className="size-5" aria-hidden="true" />
        </AlignButton.Root>
      </AlignDrawer.Trigger>
      <AlignDrawer.Content side="bottom">
        <div className="flex items-start gap-3 p-5">
          <div className="min-w-0 flex-1">
            <AlignDrawer.Title asChild>
              <Typography as="h2" variant="label" className="text-text-strong-950">
                {text(copy.title)}
              </Typography>
            </AlignDrawer.Title>
            <AlignDrawer.Description asChild>
              <Typography as="p" variant="caption" className="mt-1 text-text-sub-600">
                {text(copy.description)}
              </Typography>
            </AlignDrawer.Description>
          </div>
          <AlignDrawer.Close asChild>
            <AlignButton.Root
              variant="neutral"
              mode="ghost"
              size="medium"
              className="size-10 shrink-0 p-2.5"
              aria-label={text("closeFilter", {
                name: text(copy.title).toLocaleLowerCase(language),
              })}
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

export function MapControlPanel({
  children,
  label,
  title,
  toggleName = title,
  icon: Icon,
  controlsId,
  shortcut,
  width = 300,
  className,
  open,
  onOpenChange,
}: {
  children: ReactNode;
  label: string;
  title: string;
  toggleName?: string;
  icon: typeof RiFilter3Line;
  controlsId: string;
  shortcut?: string;
  width?: number;
  className: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { text, language } = useLocale();
  const toggle = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (event.target instanceof Element && event.target.closest('[role="listbox"]')) return;
      event.preventDefault();
      event.stopPropagation();
      onOpenChange(false);
      toggle.current?.focus();
    }
    window.addEventListener("keydown", closeOnEscape, true);
    return () => window.removeEventListener("keydown", closeOnEscape, true);
  }, [open, onOpenChange]);

  return (
    <m.section
      initial={false}
      animate={{ width: open ? width : 40, height: open ? "auto" : 40 }}
      transition={
        reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.45, bounce: 0.25 }
      }
      className={`pointer-events-auto absolute right-0 z-20 overflow-hidden rounded-10 bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 ${className}`}
      aria-label={text(label)}
    >
      <AlignButton.Root
        ref={toggle}
        variant="neutral"
        mode="ghost"
        size="medium"
        className="absolute right-0 top-0 z-10 size-10 p-2.5"
        aria-label={text(open ? "closeFilter" : "openFilter", {
          name: text(toggleName).toLocaleLowerCase(language),
        })}
        aria-expanded={open}
        aria-controls={controlsId}
        aria-keyshortcuts={shortcut}
        onClick={() => onOpenChange(!open)}
      >
        {[
          { Icon, name: "toggle", active: !open },
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
        id={controlsId}
        inert={!open}
        aria-hidden={!open}
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.1, delay: open && !reducedMotion ? 0.1 : 0 }}
        className="flex flex-col gap-3 p-4"
        style={{ width }}
      >
        <Typography as="h2" variant="label" className="m-0 pr-8">
          {text(title)}
        </Typography>
        {children}
      </m.div>
    </m.section>
  );
}

export function Overlay({
  navigation,
  search,
  searchLeading,
  viewControl,
  children,
  controlsLabel,
  home,
  filterCopy = defaultFilterCopy,
}: {
  navigation: ReactNode;
  search: ReactNode;
  searchLeading?: ReactNode;
  viewControl?: ReactNode;
  children: ReactNode;
  controlsLabel: string;
  home?: ReactNode;
  filterCopy?: FilterCopy;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  useKeyboardShortcuts({ f: () => setFiltersOpen((open) => !open) });

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
          <div className="flex min-h-10 w-[348px] items-center gap-2 max-[1100px]:order-1 max-[1100px]:w-full">
            {home && <div className="pointer-events-auto shrink-0 min-[1100px]:hidden">{home}</div>}
            {searchLeading && <div className="pointer-events-auto shrink-0">{searchLeading}</div>}
            <div className="pointer-events-auto min-w-0 flex-1 min-[1100px]:order-2">{search}</div>
            <div className="pointer-events-auto size-10 shrink-0 min-[1100px]:hidden">
              {compact && (
                <FilterDrawer copy={filterCopy} open={filtersOpen} onOpenChange={setFiltersOpen}>
                  {children}
                </FilterDrawer>
              )}
            </div>
          </div>
          {!compact && (
            <MapControlPanel
              label={controlsLabel}
              title="Filter"
              toggleName={filterCopy.title}
              icon={RiFilter3Line}
              controlsId="desktop-filters"
              shortcut="F"
              className="top-[52px]"
              open={filtersOpen}
              onOpenChange={setFiltersOpen}
            >
              {children}
            </MapControlPanel>
          )}
        </div>
      </div>
      {viewControl && (
        <div className="fixed right-4 bottom-4 z-10 max-[1100px]:right-3 max-[1100px]:bottom-3">
          {viewControl}
        </div>
      )}
    </>
  );
}
