import { FormInput } from "@/ui/form-control";
import type { ReactNode } from "react";
import { RiCloseLine, RiSearchLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";

export type AdminFilterTab<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

export function AdminFilterBar<T extends string>({
  ariaLabel,
  tabs,
  activeTab,
  onTabChange,
  tabLabelClassName,
  children,
}: {
  ariaLabel: string;
  tabs: ReadonlyArray<AdminFilterTab<T>>;
  activeTab: T;
  onTabChange: (value: T) => void;
  tabLabelClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className="flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stroke-soft-200 px-3 py-1.5"
      aria-label={ariaLabel}
    >
      <div className="flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <AlignButton.Root
              key={tab.value}
              size="xxsmall"
              variant="neutral"
              mode={active ? "lighter" : "ghost"}
              aria-pressed={active}
              onClick={() => onTabChange(tab.value)}
            >
              <span className={tabLabelClassName}>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ms-2 text-text-sub-600 tabular-nums">{tab.count}</span>
              )}
            </AlignButton.Root>
          );
        })}
      </div>
      {children}
    </div>
  );
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <label className="relative flex flex-1 items-center sm:w-60">
      <RiSearchLine
        className="pointer-events-none absolute left-2.5 size-3.5 text-text-sub-600"
        aria-hidden="true"
      />
      <FormInput
        variant="bare"
        type="search"
        value={value}
        onValueChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-10 w-full appearance-none rounded-md border border-stroke-soft-200 bg-bg-white-0 pl-9 pr-8 text-text-strong-950 placeholder:text-text-sub-600 focus:border-stroke-strong-950 focus:outline-none sm:pointer-fine:h-7 sm:pointer-fine:pl-8 sm:pointer-fine:pr-7 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear filter"
          className="absolute right-1.5 inline-flex size-5 items-center justify-center rounded text-text-sub-600 hover:text-text-strong-950 pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2 pointer-coarse:before:size-11 pointer-coarse:before:-translate-x-1/2 pointer-coarse:before:-translate-y-1/2 pointer-coarse:before:content-['']"
        >
          <RiCloseLine className="size-3.5" />
        </button>
      )}
    </label>
  );
}
