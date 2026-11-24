import type { ComponentProps } from "react";
import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react";
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react/select";

export function ThesisSelectTrigger({ className, ...props }: ComponentProps<typeof SelectTrigger>) {
  return (
    <SelectTrigger
      {...props}
      className={`flex min-h-9 min-w-0 items-center gap-2 rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 py-1.5 text-left text-base text-text-strong-950 focus-visible:outline-2 focus-visible:outline-primary-base sm:text-paragraph-sm ${className ?? ""}`}
    >
      <SelectValue maxLabels={1} className="min-w-0 truncate" />
      <RiArrowDownSLine aria-hidden="true" className="ml-auto size-5 shrink-0 text-text-sub-600" />
    </SelectTrigger>
  );
}

export function ThesisSelectContent({ children }: ComponentProps<typeof SelectContent>) {
  return (
    <SelectContent
      align="start"
      sideOffset={4}
      className="m-0 max-h-[min(18rem,var(--available-height))] w-max min-w-(--anchor-width) max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-1 text-paragraph-sm text-text-strong-950 shadow-regular-md"
    >
      {children}
    </SelectContent>
  );
}

export function ThesisSelectItem({ value, label }: { value: string; label: string }) {
  return (
    <SelectItem
      value={value}
      label={label}
      className="flex cursor-[var(--interactive-cursor)] items-center justify-between gap-2 rounded-lg px-2 py-1.5 data-highlighted:bg-bg-soft-200"
    >
      {label}
      <SelectItemIndicator>
        <RiCheckLine aria-hidden="true" className="size-4 shrink-0" />
      </SelectItemIndicator>
    </SelectItem>
  );
}
