import { useDeferredValue, useMemo } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { useLocale } from "@/useLocale";
import { AlignButton } from "@/ui/button";
import { AlignEmptyState } from "@/ui/empty-state";
import { Typography } from "@/ui/typography";
import { ThesisCard } from "./ThesisCard";
import { ThesisSearchFilters } from "./ThesisSearchFilters";
import type { ThesisSearch } from "../-shared/schema";
import { filterTheses, type ThesesIndexData } from "../-shared/thesis";

const route = getRouteApi("/_public/theses/");

function ThesesEmpty() {
  const { text } = useLocale("theses");
  return (
    <AlignEmptyState.Root align="center">
      <AlignEmptyState.Title>{text("No theses yet")}</AlignEmptyState.Title>
    </AlignEmptyState.Root>
  );
}

function NoMatch() {
  const { text } = useLocale("theses");
  return (
    <AlignEmptyState.Root align="center">
      <AlignEmptyState.Title>{text("No matching theses")}</AlignEmptyState.Title>
      <AlignEmptyState.Description>
        {text("Try another keyword or clear the filters.")}
      </AlignEmptyState.Description>
    </AlignEmptyState.Root>
  );
}

export function ThesesBrowser({ data }: { data: ThesesIndexData }) {
  const { text } = useLocale("theses");
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { q = "", year, type, field } = search;
  const deferredQuery = useDeferredValue(q);
  const filtered = useMemo(
    () =>
      filterTheses(data.items, {
        query: deferredQuery,
        year: year ?? null,
        type: type ?? null,
        field: field ?? null,
      }),
    [data.items, deferredQuery, year, type, field],
  );

  function updateSearch(patch: ThesisSearch) {
    void navigate({
      search: (current) => ({ ...current, ...patch }),
      replace: true,
      resetScroll: false,
    });
  }

  if (data.items.length === 0) return <ThesesEmpty />;

  return (
    <div className="grid gap-4">
      <ThesisSearchFilters
        query={q}
        year={year}
        type={type}
        field={field}
        years={data.years}
        types={data.types}
        fields={data.fields}
        onQueryChange={(value) => updateSearch({ q: value || undefined })}
        onYearChange={(value) => updateSearch({ year: value })}
        onTypeChange={(value) => updateSearch({ type: value })}
        onFieldChange={(value) => updateSearch({ field: value })}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Typography as="p" variant="caption" color="muted" role="status" className="m-0">
          {text("{{count}} theses", { count: filtered.length })}
        </Typography>
        {(q || year !== undefined || type || field) && (
          <AlignButton.Root
            size="xxsmall"
            variant="neutral"
            mode="stroke"
            onClick={() =>
              updateSearch({ q: undefined, year: undefined, type: undefined, field: undefined })
            }
          >
            {text("Clear filters")}
          </AlignButton.Root>
        )}
      </div>
      {filtered.length ? (
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {filtered.map((thesis) => (
            <li key={thesis.slug} className="min-w-0">
              <ThesisCard thesis={thesis} search={search} />
            </li>
          ))}
        </ul>
      ) : (
        <NoMatch />
      )}
    </div>
  );
}
