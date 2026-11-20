import type { ReactNode } from "react";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";

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
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("button, a")) return;
        if (!window.getSelection()?.toString()) onSelect();
      }}
      className={`grid gap-4 border-b border-stroke-soft-200 px-4 py-3 transition-colors hover:bg-bg-weak-50/60 xl:cursor-[var(--interactive-cursor)] xl:data-[selected=true]:bg-primary-alpha-16 xl:data-[selected=true]:hover:bg-primary-alpha-16 ${className}`}
    >
      {children}
    </article>
  );
}

export function AdminTableInspectButton({
  as = "h3",
  ariaLabel,
  selected,
  onSelect,
  className = "min-w-0 font-semibold",
  buttonClassName = "font-semibold",
  children,
}: {
  as?: "h3" | "p";
  ariaLabel: string;
  selected: boolean;
  onSelect: () => void;
  className?: string;
  buttonClassName?: string;
  children: ReactNode;
}) {
  return (
    <Typography as={as} variant="labelSmall" className={className}>
      <AlignButton.Root
        variant="neutral"
        mode="ghost"
        size="xxsmall"
        onClick={onSelect}
        className={`block h-auto max-w-full truncate rounded-sm p-0 text-left text-label-xs text-text-strong-950 hover:bg-transparent hover:underline${buttonClassName ? ` ${buttonClassName}` : ""}`}
        aria-label={ariaLabel}
        aria-pressed={selected}
      >
        {children}
      </AlignButton.Root>
    </Typography>
  );
}
