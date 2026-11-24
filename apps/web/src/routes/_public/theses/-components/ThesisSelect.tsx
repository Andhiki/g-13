import type { ComponentProps, ReactNode } from "react";
import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react";
import {
  SelectContent,
  SelectEmpty,
  SelectGroup,
  SelectGroupLabel,
  SelectInput,
  SelectList,
  SelectItem,
  SelectItemIndicator,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react/select";
import type { ThesisField } from "../-shared/thesis";

export function ThesisSelectTrigger({
  className,
  valueLabel,
  ...props
}: ComponentProps<typeof SelectTrigger> & { valueLabel?: string }) {
  return (
    <SelectTrigger
      {...props}
      className={`flex min-h-9 min-w-0 max-w-full items-center gap-2 rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 py-1.5 text-left text-base text-text-strong-950 focus-visible:outline-2 focus-visible:outline-primary-base sm:text-paragraph-sm ${className ?? ""}`}
    >
      {valueLabel ?? <SelectValue className="min-w-0 truncate" />}
      <RiArrowDownSLine aria-hidden="true" className="ml-auto size-5 shrink-0 text-text-sub-600" />
    </SelectTrigger>
  );
}

export function ThesisSelectContent({
  children,
  searchable,
}: ComponentProps<typeof SelectContent> & { searchable?: boolean }) {
  return (
    <SelectContent
      align="start"
      sideOffset={4}
      className={`m-0 max-h-[min(18rem,var(--available-height))] w-max min-w-(--anchor-width) max-w-[calc(100vw-1rem)] overscroll-contain rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-1 text-paragraph-sm text-text-strong-950 shadow-regular-md ${searchable ? "flex flex-col overflow-hidden" : "overflow-y-auto"}`}
    >
      {children}
    </SelectContent>
  );
}

export function ThesisSelectItem({
  value,
  label,
  multiple,
}: {
  value: string;
  label: string;
  multiple?: boolean;
}) {
  return (
    <SelectItem
      value={value}
      label={label}
      className="flex cursor-[var(--interactive-cursor)] items-center justify-between gap-2 rounded-lg px-2 py-1.5 data-highlighted:bg-bg-soft-200"
    >
      {multiple ? (
        <span
          aria-hidden="true"
          className="grid size-4 shrink-0 place-items-center rounded border border-stroke-soft-200"
        >
          <SelectItemIndicator>
            <RiCheckLine className="size-3" />
          </SelectItemIndicator>
        </span>
      ) : null}
      <span className="min-w-0 flex-1">{label}</span>
      {!multiple && (
        <SelectItemIndicator>
          <RiCheckLine aria-hidden="true" className="size-4 shrink-0" />
        </SelectItemIndicator>
      )}
    </SelectItem>
  );
}

export function ThesisFieldOptions({
  fields,
  searchLabel,
  emptyLabel,
  multiple,
  children,
}: {
  fields: ThesisField[];
  searchLabel: string;
  emptyLabel: string;
  multiple?: boolean;
  children?: ReactNode;
}) {
  const groups = new Map<string, ThesisField[]>();
  for (const field of fields) {
    const group = groups.get(field.lab) ?? [];
    group.push(field);
    groups.set(field.lab, group);
  }
  return (
    <ThesisSelectContent searchable>
      <SelectInput
        aria-label={searchLabel}
        placeholder={searchLabel}
        className="w-full shrink-0 rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-3 py-2 text-base outline-none focus:border-stroke-strong-950 sm:text-paragraph-sm"
      />
      <SelectEmpty className="p-2 text-text-sub-600">{emptyLabel}</SelectEmpty>
      <SelectList className="min-h-0 overflow-y-auto overscroll-contain">
        {children}
        {Array.from(groups, ([lab, entries]) => (
          <SelectGroup key={lab}>
            <SelectGroupLabel className="px-2 py-1 text-label-xs text-text-sub-600">
              {lab}
            </SelectGroupLabel>
            {entries.map((field) => (
              <ThesisSelectItem
                key={field.id}
                value={field.id}
                label={field.name}
                multiple={multiple}
              />
            ))}
          </SelectGroup>
        ))}
      </SelectList>
    </ThesisSelectContent>
  );
}
