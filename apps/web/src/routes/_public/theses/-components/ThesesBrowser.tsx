import { useDeferredValue, useMemo, useState } from "react";
import { RiFileTextLine, RiSearchLine } from "@remixicon/react";
import { useLocale } from "@/useLocale";
import { AlignButton } from "@/ui/button";
import { AlignEmptyState } from "@/ui/empty-state";
import { Typography } from "@/ui/typography";
import { ThesisCard } from "./ThesisCard";
import { ThesisSearchFilters } from "./ThesisSearchFilters";
import { filterTheses, type ThesesIndexData, type ThesisType } from "../-shared/thesis";

const all = "all";

function ThesesEmpty() {
  const { text } = useLocale("theses");
  return (
    <AlignEmptyState.Root align="center">
      <AlignEmptyState.Icon>
        <RiFileTextLine />
      </AlignEmptyState.Icon>
      <AlignEmptyState.Title>{text("No theses yet")}</AlignEmptyState.Title>
      <AlignEmptyState.Description>
        {text("Theses will appear here once an author submits one.")}
      </AlignEmptyState.Description>
    </AlignEmptyState.Root>
  );
}

function NoMatch({ onClear }: { onClear: () => void }) {
  const { text } = useLocale("theses");
  return (
    <AlignEmptyState.Root align="center">
      <AlignEmptyState.Icon>
        <RiSearchLine />
      </AlignEmptyState.Icon>
      <AlignEmptyState.Title>{text("No theses match this search.")}</AlignEmptyState.Title>
      <AlignEmptyState.Description>
        {text("Try another keyword or clear the filters.")}
      </AlignEmptyState.Description>
      <AlignEmptyState.Actions>
        <AlignButton.Root size="small" variant="neutral" mode="stroke" onClick={onClear}>
          {text("Clear filters")}
        </AlignButton.Root>
      </AlignEmptyState.Actions>
    </AlignEmptyState.Root>
  );
}

export function ThesesBrowser({ data }: { data: ThesesIndexData }) {
  const { text } = useLocale("theses");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState(all);
  const [type, setType] = useState(all);
  const [field, setField] = useState(all);
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(
    () =>
      filterTheses(data.items, {
        query: deferredQuery,
        year: year === all ? null : Number(year),
        type: type === all ? null : (type as ThesisType),
        field: field === all ? null : field,
      }),
    [data.items, deferredQuery, year, type, field],
  );
  const clearAll = () => {
    setQuery("");
    setYear(all);
    setType(all);
    setField(all);
  };

  if (data.items.length === 0) return <ThesesEmpty />;

  return (
    <div className="grid gap-4">
      <ThesisSearchFilters
        query={query}
        year={year}
        type={type}
        field={field}
        years={data.years}
        types={data.types}
        fields={data.fields}
        onQueryChange={setQuery}
        onYearChange={setYear}
        onTypeChange={setType}
        onFieldChange={setField}
      />
      <Typography as="p" variant="caption" color="muted" role="status" className="m-0">
        {text("{{count}} theses", { count: filtered.length })}
      </Typography>
      {filtered.length ? (
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {filtered.map((thesis) => (
            <li key={thesis.slug} className="min-w-0">
              <ThesisCard thesis={thesis} />
            </li>
          ))}
        </ul>
      ) : (
        <NoMatch onClear={clearAll} />
      )}
    </div>
  );
}
