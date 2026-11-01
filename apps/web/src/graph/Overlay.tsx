import { useLocale } from "../useLocale";
import { Typography } from "../ui/typography";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { RiCloseLine, RiStackLine } from "@remixicon/react";
import { AlignButton } from "../ui/button";
import { AlignDrawer } from "../ui/drawer";
import { useKeyboardShortcuts } from "../ui/use-keyboard-shortcuts";

const compactQuery = "(width < 1100px)";

function subscribeToCompactControls(onChange: () => void) {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

type PanelCopy = {
  title: string;
  description: string;
  openLabel: string;
  icon: typeof RiStackLine;
};
const defaultPanelCopy: PanelCopy = {
  title: "Kurikulum",
  openLabel: "Pilih kurikulum",
  icon: RiStackLine,
  description: "Pilih versi kurikulum.",
};

function MapControlDrawer({
  children,
  copy,
  open,
  onOpenChange,
}: {
  children: ReactNode;
  copy: PanelCopy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { text, language } = useLocale();
  const Icon = copy.icon;
  return (
    <AlignDrawer.Root open={open} onOpenChange={onOpenChange}>
      <AlignDrawer.Trigger asChild>
        <AlignButton.Root
          variant="neutral"
          mode="stroke"
          size="medium"
          className="size-10 p-2.5"
          aria-label={text(copy.openLabel)}
          title={text(copy.openLabel)}
          aria-expanded={open}
          aria-keyshortcuts="F"
        >
          <Icon className="size-5" aria-hidden="true" />
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
              aria-label={text("closePanel", {
                name: text(copy.title).toLocaleLowerCase(language),
              })}
            >
              <RiCloseLine className="size-5" aria-hidden="true" />
            </AlignButton.Root>
          </AlignDrawer.Close>
        </div>
        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto overscroll-contain px-5 pb-5">
          {children}
        </div>
      </AlignDrawer.Content>
    </AlignDrawer.Root>
  );
}

export function MapControlPanel({
  children,
  label,
  title,
  openLabel,
  icon: Icon,
  controlsId,
  shortcut,
  width = 300,
  anchor = "top",
  className,
  open,
  onOpenChange,
}: {
  children: ReactNode;
  label: string;
  title: string;
  openLabel?: string;
  icon: typeof RiStackLine;
  controlsId: string;
  shortcut?: string;
  width?: number;
  anchor?: "top" | "bottom";
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
    <section
      className={`pointer-events-none absolute right-0 z-20 ${className}`}
      style={{ width }}
      aria-label={text(label)}
    >
      <m.div
        aria-hidden="true"
        initial={false}
        animate={{
          clipPath: open
            ? "inset(0 0 0 0 round 10px)"
            : anchor === "bottom"
              ? `inset(calc(100% - 40px) 0 0 ${width - 40}px round 10px)`
              : `inset(0 0 calc(100% - 40px) ${width - 40}px round 10px)`,
        }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="absolute inset-0 rounded-10 bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200"
      />
      <AlignButton.Root
        ref={toggle}
        variant="neutral"
        mode="ghost"
        size="medium"
        className={`pointer-events-auto absolute right-0 ${anchor === "bottom" ? "bottom-0" : "top-0"} z-10 size-10 p-2.5`}
        aria-label={
          !open && openLabel
            ? text(openLabel)
            : text(open ? "closePanel" : "openPanel", {
                name: text(title).toLocaleLowerCase(language),
              })
        }
        title={!open && openLabel ? text(openLabel) : undefined}
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
              scale: active ? 1 : 0.9,
            }}
            transition={
              reducedMotion ? { duration: 0 } : { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
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
        className={`relative flex flex-col gap-3 p-4 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        style={{ width }}
      >
        <Typography
          as="h2"
          variant="label"
          className={`m-0 pr-8 ${anchor === "bottom" ? "order-last" : ""}`}
        >
          {text(title)}
        </Typography>
        {children}
      </m.div>
    </section>
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
  panelCopy = defaultPanelCopy,
}: {
  navigation: ReactNode;
  search: ReactNode;
  searchLeading?: ReactNode;
  viewControl?: ReactNode;
  children: ReactNode;
  controlsLabel: string;
  home?: ReactNode;
  panelCopy?: PanelCopy;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  useKeyboardShortcuts({ f: () => setPanelOpen((open) => !open) });

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
      <div
        className={`pointer-events-none fixed inset-x-4 top-[calc(var(--app-header-height)+14px)] z-10 flex items-start text-text-strong-950 max-[1100px]:inset-x-3 max-[1100px]:top-[calc(var(--app-header-height)+12px)] max-[1100px]:flex-col max-[1100px]:gap-2 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] ${!search && !searchLeading ? "min-[650px]:max-[1100px]:flex-row" : ""}`}
      >
        <div className="min-w-0 flex-1 basis-0 max-[1100px]:hidden">{home}</div>
        <div
          className={`pointer-events-auto flex min-h-10 shrink-0 items-center justify-center max-[1100px]:order-2 max-[1100px]:w-full ${!search && !searchLeading ? "min-[650px]:max-[1100px]:absolute min-[650px]:max-[1100px]:left-1/2 min-[650px]:max-[1100px]:w-[360px] min-[650px]:max-[1100px]:-translate-x-1/2" : ""}`}
        >
          {navigation}
        </div>
        <div className="relative flex min-w-0 flex-1 basis-0 flex-col items-end gap-3 max-[1100px]:contents">
          <div className="flex min-h-10 w-[348px] items-center gap-2 max-[1100px]:order-1 max-[1100px]:w-full">
            {home && <div className="pointer-events-auto shrink-0 min-[1100px]:hidden">{home}</div>}
            {searchLeading && <div className="pointer-events-auto shrink-0">{searchLeading}</div>}
            <div className="pointer-events-auto min-w-0 flex-1 min-[1100px]:order-2">{search}</div>
            <div className="pointer-events-auto size-10 shrink-0 min-[1100px]:hidden">
              <MapControlDrawer
                copy={panelCopy}
                open={compact && panelOpen}
                onOpenChange={setPanelOpen}
              >
                {children}
              </MapControlDrawer>
            </div>
          </div>
          {!compact && (
            <MapControlPanel
              label={controlsLabel}
              title={panelCopy.title}
              openLabel={panelCopy.openLabel}
              icon={panelCopy.icon}
              controlsId="desktop-map-controls"
              shortcut="F"
              className={`${search || searchLeading ? "top-[52px]" : "top-0"} max-[1100px]:hidden`}
              open={panelOpen}
              onOpenChange={setPanelOpen}
            >
              {children}
            </MapControlPanel>
          )}
        </div>
      </div>
      {viewControl && (
        <div className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 max-[1100px]:right-[max(0.75rem,env(safe-area-inset-right))] max-[1100px]:bottom-[max(0.75rem,env(safe-area-inset-bottom))]">
          {viewControl}
        </div>
      )}
    </>
  );
}
