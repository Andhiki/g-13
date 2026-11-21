import { Typography } from "@/ui/typography";
import { useEffect, useId, useRef, useState } from "react";
import { RiCheckLine, RiSearchLine } from "@remixicon/react";
import { AlignCommandMenu } from "@/ui/command-menu";
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
    if (!sentinel || !picker.hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && !picker.isFetchingNextPage) {
        void picker.fetchNextPage();
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [picker.data, picker.hasNextPage, picker.isFetchingNextPage, picker.fetchNextPage]);

  const closeMenu = () => {
    setOpen(false);
    setQuery("");
    setDebouncedQuery("");
  };
  return (
    <div
      className="grid min-w-0 gap-2 sm:grid-cols-[240px_minmax(0,1fr)] sm:gap-6"
      onBlurCapture={(event) => {
        if (
          !event.currentTarget.contains(
            event.relatedTarget instanceof Node ? event.relatedTarget : null,
          )
        ) {
          closeMenu();
        }
      }}
    >
      <div>
        <Typography as="label" variant="label" htmlFor={id}>
          {text("Course")}
        </Typography>
      </div>
      <div className="relative min-w-0">
        <AlignCommandMenu.Root
          shouldFilter={false}
          label={text("Course")}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              event.preventDefault();
              closeMenu();
            } else if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
              setOpen(true);
            }
          }}
        >
          <div className="flex h-9 items-center gap-2 rounded-10 border border-stroke-soft-200 px-3 focus-within:ring-2 focus-within:ring-primary-alpha-16">
            <RiSearchLine aria-hidden="true" className="size-5 shrink-0 text-text-sub-600" />
            <AlignCommandMenu.Input
              asChild
              id={id}
              aria-label={text("Course")}
              aria-expanded={open}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              className="h-full min-w-0 text-base sm:text-paragraph-sm"
              value={
                open
                  ? query
                  : selected
                    ? `${selected.code} · ${courseDisplayName(selected, language)}`
                    : ""
              }
              placeholder={text("Course code or name")}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
              onValueChange={(next) => {
                setQuery(next);
                onChange("");
                setOpen(true);
              }}
            >
              <input id={id} aria-expanded={open} />
            </AlignCommandMenu.Input>
          </div>
          {open && (
            <AlignCommandMenu.List
              className="absolute inset-x-0 top-10 z-20 max-h-64 overflow-y-auto rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-1 shadow-regular-md"
              aria-label={text("Courses")}
            >
              {rows.map((course) => (
                <AlignCommandMenu.Item
                  key={course.id}
                  value={course.id}
                  className="min-h-9 rounded-md px-2 py-1.5 text-paragraph-sm"
                  onSelect={() => {
                    onChange(course.id);
                    setPicked(course);
                    closeMenu();
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <Typography as="span" variant="paragraph" className="block text-paragraph-sm">
                      {courseDisplayName(course, language)}
                    </Typography>
                    <Typography as="span" variant="code" className="text-text-sub-600">
                      {course.code}
                    </Typography>
                  </span>
                  {value === course.id && (
                    <RiCheckLine aria-hidden="true" className="size-4 shrink-0 text-primary-base" />
                  )}
                </AlignCommandMenu.Item>
              ))}
              {!rows.length && !picker.isPending && (
                <AlignCommandMenu.Empty className="p-3 text-paragraph-sm text-text-sub-600">
                  {text("No courses match this search.")}
                </AlignCommandMenu.Empty>
              )}
              {picker.hasNextPage && <div ref={sentinelRef} aria-hidden="true" />}
            </AlignCommandMenu.List>
          )}
        </AlignCommandMenu.Root>
        {error && (
          <Typography
            as="p"
            variant="caption"
            id={`${id}-error`}
            className="mb-0 mt-1.5 text-error-base"
          >
            {error}
          </Typography>
        )}
      </div>
    </div>
  );
}
