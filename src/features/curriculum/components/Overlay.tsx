import { Typography } from "../../../ui/typography";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { RiCloseLine, RiFilter3Line } from "@remixicon/react";
import { AlignButton } from "../../../ui/button";
import { AlignDrawer } from "../../../ui/drawer";

const compactQuery = "(width < 1100px)";

function subscribeToCompactControls(onChange: () => void) {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function BrandLogo() {
  return (
    <a
      href="https://www.omahti.web.id/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="OmahTI, pembuat peta kurikulum"
      className="pointer-events-auto flex h-10 w-fit shrink-0 items-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-base"
    >
      <img
        src="/brand/omahti-light.svg"
        alt="OmahTI"
        width={54}
        height={21}
        className="h-[21px] w-auto dark:hidden"
      />
      <img
        src="/brand/omahti-dark.svg"
        alt="OmahTI"
        width={54}
        height={21}
        className="hidden h-[21px] w-auto dark:block"
      />
    </a>
  );
}

type FilterCopy = { title: string; description: string; action: string };
const defaultFilterCopy: FilterCopy = {
  title: "Filter kurikulum",
  description: "Pilih versi kurikulum dan kelompok mata kuliah.",
  action: "Tampilkan mata kuliah",
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
        <div className="p-5">
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
        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-5 pb-5">{children}</div>
        <div className="grid border-t border-stroke-soft-200 p-5">
          <AlignDrawer.Close asChild>
            <AlignButton.Root variant="neutral" mode="filled" size="medium">
              {copy.action}
            </AlignButton.Root>
          </AlignDrawer.Close>
        </div>
      </AlignDrawer.Content>
    </AlignDrawer.Root>
  );
}

function DesktopFilters({
  children,
  label,
  copy,
}: {
  children: ReactNode;
  label: string;
  copy: FilterCopy;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      setOpen(false);
      toggle.current?.focus();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <motion.section
      initial={false}
      animate={{ width: open ? 300 : 40, height: open ? "auto" : 40 }}
      transition={
        reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.45, bounce: 0.25 }
      }
      className="pointer-events-auto relative overflow-hidden rounded-10 bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 max-[1100px]:hidden"
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
          <motion.span
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
          </motion.span>
        ))}
      </AlignButton.Root>
      <motion.div
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
      </motion.div>
    </motion.section>
  );
}

export function Overlay({
  navigation,
  appearance,
  search,
  viewControl,
  children,
  controlsLabel,
  home,
  filterCopy = defaultFilterCopy,
}: {
  navigation: ReactNode;
  appearance: ReactNode;
  search: ReactNode;
  viewControl: ReactNode;
  children: ReactNode;
  controlsLabel: string;
  home?: ReactNode;
  filterCopy?: FilterCopy;
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
        <div className="min-w-0 flex-1 basis-0 max-[1100px]:hidden">{home ?? <BrandLogo />}</div>
        <div className="pointer-events-auto flex min-h-10 shrink-0 items-center justify-center max-[1100px]:order-2 max-[1100px]:w-full">
          {navigation}
        </div>
        <div className="flex min-w-0 flex-1 basis-0 flex-col items-end gap-3 max-[1100px]:contents">
          <div className="flex min-h-10 w-[348px] items-center gap-2 max-[1100px]:order-1 max-[1100px]:w-full">
            {home && <div className="pointer-events-auto shrink-0 min-[1100px]:hidden">{home}</div>}
            <div className="pointer-events-auto min-w-0 flex-1 min-[1100px]:order-2">{search}</div>
            <div className="pointer-events-auto shrink-0">{appearance}</div>
            <div className="pointer-events-auto size-10 shrink-0 min-[1100px]:hidden">
              {compact && <FilterDrawer copy={filterCopy}>{children}</FilterDrawer>}
            </div>
          </div>
          {!compact && (
            <DesktopFilters label={controlsLabel} copy={filterCopy}>
              {children}
            </DesktopFilters>
          )}
        </div>
      </header>
      <div className="fixed right-4 bottom-4 z-10 max-[1100px]:right-3 max-[1100px]:bottom-3">
        {viewControl}
      </div>
    </>
  );
}
