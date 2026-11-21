import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@ui-sdk/react/combobox";
import { useEffect, useId, useRef, useState } from "react";
import { RiCheckLine, RiSearchLine } from "@remixicon/react";
import { Typography } from "@/ui/typography";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocale } from "@/useLocale";
import { courseDisplayName, type ReviewCourseOption } from "../-shared/course-search";
import { coursePickerQueryOptions } from "../-client/queries";

const searchDebounceMs = 250;

export function ReviewCourseField({
  initialCourse,
  value,
  onChange,
  error,
}: {
  initialCourse?: ReviewCourseOption;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const { text, language } = useLocale("lecturers");
  const id = useId();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [field, setField] = useState<HTMLDivElement | null>(null);
  const [picked, setPicked] = useState<ReviewCourseOption | null>(initialCourse ?? null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const picker = useInfiniteQuery(coursePickerQueryOptions(debouncedQuery, language));
  const rows = picker.data?.pages.flatMap((page) => page.rows) ?? [];
  const selected = rows.find((row) => row.id === value) ?? (picked?.id === value ? picked : null);

  useEffect(() => {
    if (query === debouncedQuery) return;
    const timer = setTimeout(() => setDebouncedQuery(query), searchDebounceMs);
    return () => clearTimeout(timer);
  }, [query, debouncedQuery]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !open || !picker.hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && !picker.isFetchingNextPage) {
        void picker.fetchNextPage();
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, picker.data, picker.hasNextPage, picker.isFetchingNextPage, picker.fetchNextPage]);

  return (
    <div className="grid min-w-0 gap-2 sm:grid-cols-[240px_minmax(0,1fr)] sm:gap-6">
      <div>
        <Typography as="label" variant="label" htmlFor={id}>
          {text("Course")}
        </Typography>
      </div>
      <div className="relative min-w-0">
        <Combobox
          value={selected ?? null}
          itemToValue={(course) => course.id}
          itemToLabel={(course) => courseDisplayName(course, language)}
          onValueChange={(next) => {
            onChange(next ? next.id : "");
            if (next) setPicked(next);
          }}
          query={
            open
              ? query
              : selected
                ? `${selected.code} · ${courseDisplayName(selected, language)}`
                : ""
          }
          onQueryChange={(next, details) => {
            if (details.reason === "input-change") {
              setQuery(next);
              onChange("");
              setOpen(true);
            }
          }}
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) {
              setQuery("");
              setDebouncedQuery("");
            }
          }}
          filter={false}
          autoHighlight
          loop={false}
        >
          <div
            ref={setField}
            className="flex h-9 items-center gap-2 rounded-10 border border-stroke-soft-200 px-3 transition-colors focus-within:border-stroke-strong-950"
          >
            <RiSearchLine aria-hidden="true" className="size-5 shrink-0 text-text-sub-600" />
            <ComboboxInput
              id={id}
              aria-label={text("Course")}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              className="h-full w-full min-w-0 bg-transparent text-base text-text-strong-950 outline-none transition duration-200 ease-out placeholder:text-text-soft-400 sm:text-paragraph-sm"
              placeholder={text("Course code or name")}
              onFocus={() => setOpen(true)}
            />
          </div>
          <ComboboxContent
            anchor={field}
            side="bottom"
            align="start"
            sideOffset={4}
            className="max-h-64 w-[var(--anchor-width)] overflow-y-auto rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-1 shadow-regular-md"
          >
            {!rows.length && !picker.isPending && (
              <ComboboxEmpty className="p-3 text-paragraph-sm text-text-sub-600">
                {text("No courses match this search.")}
              </ComboboxEmpty>
            )}
            <ComboboxList aria-label={text("Courses")}>
              {rows.map((course) => (
                <ComboboxItem
                  key={course.id}
                  value={course}
                  label={courseDisplayName(course, language)}
                  className="flex min-h-9 cursor-[var(--interactive-cursor)] items-center gap-3 rounded-md bg-bg-white-0 px-2 py-1.5 text-paragraph-sm text-text-strong-950 transition duration-200 ease-out data-highlighted:bg-bg-weak-50"
                >
                  {(state) => (
                    <>
                      <span className="min-w-0 flex-1">
                        <Typography as="span" variant="paragraph" className="block">
                          {courseDisplayName(course, language)}
                        </Typography>
                        <Typography as="span" variant="code" color="muted">
                          {course.code}
                        </Typography>
                      </span>
                      {state.selected && (
                        <RiCheckLine
                          aria-hidden="true"
                          className="size-4 shrink-0 text-primary-base"
                        />
                      )}
                    </>
                  )}
                </ComboboxItem>
              ))}
            </ComboboxList>
            {picker.hasNextPage && <div ref={sentinelRef} aria-hidden="true" />}
          </ComboboxContent>
        </Combobox>
        {error && (
          <Typography
            as="p"
            variant="caption"
            color="danger"
            id={`${id}-error`}
            className="mb-0 mt-1.5"
          >
            {error}
          </Typography>
        )}
      </div>
    </div>
  );
}
