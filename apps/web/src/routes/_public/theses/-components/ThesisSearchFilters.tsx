import { useId } from "react";
import { RiCloseLine, RiSearchLine } from "@remixicon/react";
import { useLocale } from "@/useLocale";
import { AlignSelect } from "@/ui/select";
import { thesisTypeLabelKey, type ThesisType } from "../-shared/thesis";

type SelectOption = { value: string; label: string };

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value)?.label ?? options[0]?.label;
  return (
    <AlignSelect.Root variant="compact" value={value} onValueChange={onChange}>
      <AlignSelect.Trigger aria-label={label} className="h-9 min-h-9">
        <AlignSelect.Value>{selected}</AlignSelect.Value>
      </AlignSelect.Trigger>
      <AlignSelect.Content>
        {options.map((option) => (
          <AlignSelect.Item key={option.value} value={option.value}>
            {option.label}
          </AlignSelect.Item>
        ))}
      </AlignSelect.Content>
    </AlignSelect.Root>
  );
}

export function ThesisSearchFilters({
  query,
  year,
  type,
  field,
  years,
  types,
  fields,
  onQueryChange,
  onYearChange,
  onTypeChange,
  onFieldChange,
}: {
  query: string;
  year: string;
  type: string;
  field: string;
  years: number[];
  types: ThesisType[];
  fields: string[];
  onQueryChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onFieldChange: (value: string) => void;
}) {
  const { text } = useLocale("theses");
  const searchId = useId();
  const all = "all";
  const yearOptions = [
    { value: all, label: text("All years") },
    ...years.map((value) => ({ value: String(value), label: String(value) })),
  ];
  const typeOptions = [
    { value: all, label: text("All types") },
    ...types.map((value) => ({ value, label: text(thesisTypeLabelKey(value)) })),
  ];
  const fieldOptions = [
    { value: all, label: text("All fields") },
    ...fields.map((value) => ({ value, label: value })),
  ];
  const showFilters = years.length > 1 || types.length > 1 || fields.length > 0;

  return (
    <section aria-label={text("Filters")} className="grid gap-3">
      <label
        htmlFor={searchId}
        className="flex h-10 min-w-32 flex-1 items-center gap-2 rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 focus-within:ring-2 focus-within:ring-primary-alpha-16 sm:pointer-fine:h-9"
      >
        <span className="sr-only">{text("Search theses")}</span>
        <RiSearchLine aria-hidden="true" className="size-5 shrink-0 text-text-sub-600" />
        <input
          id={searchId}
          type="search"
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-text-soft-400 sm:pointer-fine:text-paragraph-sm"
          placeholder={text("Search by title, author, supervisor, or keyword")}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        {query && (
          <button
            type="button"
            className="relative flex size-8 shrink-0 items-center justify-center rounded-md text-text-sub-600 focus-visible:outline-2 focus-visible:outline-primary-base pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2 pointer-coarse:before:size-11 pointer-coarse:before:-translate-x-1/2 pointer-coarse:before:-translate-y-1/2 pointer-coarse:before:content-['']"
            aria-label={text("Clear search")}
            onClick={() => onQueryChange("")}
          >
            <RiCloseLine aria-hidden="true" className="size-4" />
          </button>
        )}
      </label>
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {years.length > 1 && (
            <FilterSelect
              label={text("Year")}
              value={year}
              options={yearOptions}
              onChange={onYearChange}
            />
          )}
          {types.length > 1 && (
            <FilterSelect
              label={text("Type")}
              value={type}
              options={typeOptions}
              onChange={onTypeChange}
            />
          )}
          {fields.length > 0 && (
            <FilterSelect
              label={text("Field")}
              value={field}
              options={fieldOptions}
              onChange={onFieldChange}
            />
          )}
        </div>
      )}
    </section>
  );
}
