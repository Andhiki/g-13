import { useSyncExternalStore, type ReactNode } from "react";
import { RiCloseLine } from "@remixicon/react";
import { CompactButton } from "@/ui/compact-button";
import { AlignDrawer } from "@/ui/drawer";

export const desktopInspectorQuery = "(min-width: 80rem)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(desktopInspectorQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function AdminInspectorLayout({
  title,
  desktopOpen,
  mobileOpen,
  onMobileOpenChange,
  details,
  children,
}: {
  title: string;
  desktopOpen: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  details: ReactNode;
  children: ReactNode;
}) {
  const desktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(desktopInspectorQuery).matches,
    () => true,
  );

  return (
    <div
      data-inspector-open={desktopOpen}
      className="group/inspector relative flex min-h-0 flex-1 [--inspector-width:320px]"
    >
      {/* Reveal the fixed-width inspector by moving only the list’s adjoining edge. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg-white-0 xl:absolute xl:z-10 xl:inset-y-0 xl:start-0 xl:end-0 xl:motion-safe:transition-[inset-inline-end] xl:motion-safe:duration-200 xl:motion-safe:ease-out motion-reduce:transition-none xl:group-data-[inspector-open=true]/inspector:end-(--inspector-width)">
        {children}
      </div>
      {desktop ? (
        <div
          inert={!desktopOpen}
          className="absolute inset-y-0 end-0 hidden w-(--inspector-width) xl:block"
        >
          {details}
        </div>
      ) : (
        <AlignDrawer.Root
          open={mobileOpen && !!details}
          onOpenChange={onMobileOpenChange}
          side="bottom"
        >
          <AlignDrawer.Content
            aria-describedby={undefined}
            className="h-[min(85dvh,40rem)] [&>div>aside]:min-h-0 [&>div>aside]:w-full [&>div>aside]:flex-1 [&>div>aside]:border-0"
          >
            <AlignDrawer.Grip />
            <AlignDrawer.Title className="sr-only">{title}</AlignDrawer.Title>
            <AlignDrawer.Close asChild>
              <CompactButton
                data-drawer-no-drag=""
                className="absolute top-3 right-3 z-10"
                aria-label="Close inspector"
              >
                <RiCloseLine aria-hidden="true" />
              </CompactButton>
            </AlignDrawer.Close>
            {details}
          </AlignDrawer.Content>
        </AlignDrawer.Root>
      )}
    </div>
  );
}

export function AdminInspectorPanel({
  title,
  ariaLabel,
  footer,
  footerClassName = "p-3",
  children,
}: {
  title: string;
  ariaLabel: string;
  footer?: ReactNode;
  footerClassName?: string;
  children: ReactNode;
}) {
  return (
    <aside
      id="moderation-inspector"
      aria-label={ariaLabel}
      className="flex h-full w-full flex-col overflow-hidden border-s border-stroke-soft-200 bg-bg-white-0"
    >
      <div className="flex h-11 shrink-0 items-center border-b border-stroke-soft-200 px-4 text-label-xs">
        {title}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-5 p-4">{children}</div>
      </div>
      {footer ? (
        <section
          className={`shrink-0 border-t border-stroke-soft-200${footerClassName ? ` ${footerClassName}` : ""}`}
        >
          {footer}
        </section>
      ) : null}
    </aside>
  );
}

export function AdminInspectorMeta({ children }: { children: ReactNode }) {
  return <dl className="space-y-2.5 text-paragraph-xs">{children}</dl>;
}

export function AdminInspectorMetaRow({
  label,
  title,
  valueClassName,
  children,
}: {
  label: string;
  title?: string;
  valueClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
      <dt className="text-text-sub-600">{label}</dt>
      <dd title={title} className={valueClassName}>
        {children}
      </dd>
    </div>
  );
}
