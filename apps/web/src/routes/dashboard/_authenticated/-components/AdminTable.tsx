import type { ReactNode } from "react";

export function AdminTableHeader({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`items-center gap-4 border-b border-stroke-soft-200 bg-bg-weak-50 px-4 py-2 text-label-xs text-text-sub-600 ${className}`}
    >
      {children}
    </div>
  );
}

export function AdminTableRow({
  className,
  selected,
  onSelect,
  children,
}: {
  className: string;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <article
      data-selected={selected}
      onClick={() => {
        if (!window.getSelection()?.toString()) onSelect();
      }}
      className={`grid gap-4 border-b border-stroke-soft-200 px-4 py-3 transition-colors hover:bg-bg-weak-50/60 xl:cursor-[var(--interactive-cursor)] xl:data-[selected=true]:bg-primary-alpha-16 xl:data-[selected=true]:hover:bg-primary-alpha-16 ${className}`}
    >
      {children}
    </article>
  );
}
