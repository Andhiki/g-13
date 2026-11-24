import { RiCloseLine, RiSearchLine } from "@remixicon/react";
import { useLocale } from "@/useLocale";
import { Input, InputClear, InputGroup } from "@ui-sdk/react/input";
import { Select } from "@ui-sdk/react/select";
import { ThesisSelectContent, ThesisSelectItem, ThesisSelectTrigger } from "./ThesisSelect";
import { thesisTypeLabelKey, type ThesisField, type ThesisType } from "../-shared/thesis";

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
  return (
    <Select value={value} items={options} onValueChange={(next) => onChange(next ?? "all")}>
      <ThesisSelectTrigger aria-label={label} />
      <ThesisSelectContent>
        {options.map((option) => (
          <ThesisSelectItem key={option.value} {...option} />
        ))}
      </ThesisSelectContent>
    </Select>
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
  fields: ThesisField[];
  onQueryChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onFieldChange: (value: string) => void;
}) {
  const { text } = useLocale("theses");
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
    { value: all, label: text("All sub-labs") },
    ...fields.map((field) => ({ value: field.id, label: field.name })),
  ];
  const showFilters = years.length > 1 || types.length > 1 || fields.length > 0;

  return (
    <section aria-label={text("Filters")} className="grid gap-3">
      <InputGroup className="flex h-10 min-w-32 flex-1 items-center gap-2 rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 focus-within:ring-2 focus-within:ring-primary-alpha-16 sm:pointer-fine:h-9">
        <RiSearchLine aria-hidden="true" className="size-5 shrink-0 text-text-sub-600" />
        <Input
          aria-label={text("Search theses")}
          type="search"
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-text-soft-400 sm:pointer-fine:text-paragraph-sm [&::-webkit-search-cancel-button]:appearance-none"
          placeholder={text("Search by title, author, supervisor, or keyword")}
          value={query}
          onValueChange={onQueryChange}
        />
        <InputClear
          className="relative flex size-8 shrink-0 items-center justify-center rounded-md text-text-sub-600 focus-visible:outline-2 focus-visible:outline-primary-base pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2 pointer-coarse:before:size-11 pointer-coarse:before:-translate-x-1/2 pointer-coarse:before:-translate-y-1/2 pointer-coarse:before:content-['']"
          aria-label={text("Clear search")}
        >
          <RiCloseLine aria-hidden="true" className="size-4" />
        </InputClear>
      </InputGroup>
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
              label={text("Sub-labs")}
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
