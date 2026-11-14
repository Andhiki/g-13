import { useId, useState } from "react";
import { RiCheckLine, RiSearchLine } from "@remixicon/react";
import { AlignCommandMenu } from "../../ui/command-menu";
import { useLocale } from "../../useLocale";
import { courseDisplayName, matchesCourseSearch } from "./course-search";

type Course = { id: string; code: string; nameId: string; nameEn: string };
export function ReviewCourseField({
  courses,
  value,
  onChange,
  error,
}: {
  courses: Course[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const { text, language } = useLocale("professors");
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = courses.find((c) => c.id === value);
  const matches = courses.filter((c) => matchesCourseSearch(c, query));
  return (
    <div
      className="relative"
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
          setQuery("");
        }
      }}
    >
      <label htmlFor={id} className="text-label-sm">
        {text("Course")}
      </label>
      <AlignCommandMenu.Root
        shouldFilter={false}
        label={text("Course")}
        className="mt-2"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            event.preventDefault();
            setOpen(false);
            setQuery("");
          } else if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <div className="flex min-h-11 items-center gap-2 rounded-10 border border-stroke-soft-200 px-3 focus-within:ring-2 focus-within:ring-primary-alpha-16">
          <RiSearchLine aria-hidden="true" className="size-5 shrink-0 text-text-sub-600" />
          <AlignCommandMenu.Input
            asChild
            id={id}
            aria-label={text("Course")}
            aria-expanded={open}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : `${id}-hint`}
            className="min-h-11 min-w-0 text-base sm:text-paragraph-sm"
            value={
              open
                ? query
                : selected
                  ? `${selected.code} · ${courseDisplayName(selected, language)}`
                  : ""
            }
            placeholder={text("Search by course code or name")}
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
            className="absolute inset-x-0 top-[4.5rem] z-20 max-h-64 overflow-y-auto rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-1 shadow-regular-md"
            aria-label={text("Courses")}
          >
            {!matches.length && (
              <AlignCommandMenu.Empty className="p-3 text-paragraph-sm text-text-sub-600">
                {text("No courses match this search.")}
              </AlignCommandMenu.Empty>
            )}
            {matches.map((course) => (
              <AlignCommandMenu.Item
                key={course.id}
                value={course.id}
                onSelect={() => {
                  onChange(course.id);
                  setQuery("");
                  setOpen(false);
                }}
                className="min-h-11"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-paragraph-sm">
                    {courseDisplayName(course, language)}
                  </span>
                  <span className="font-mono text-paragraph-xs text-text-sub-600">
                    {course.code}
                  </span>
                </span>
                {value === course.id && (
                  <RiCheckLine aria-hidden="true" className="size-4 shrink-0 text-primary-base" />
                )}
              </AlignCommandMenu.Item>
            ))}
          </AlignCommandMenu.List>
        )}
      </AlignCommandMenu.Root>
      <p
        id={error ? `${id}-error` : `${id}-hint`}
        className={`mb-0 mt-1.5 text-paragraph-xs ${error ? "text-error-base" : "text-text-sub-600"}`}
      >
        {error ?? text("Search Indonesian or English names, or a course code.")}
      </p>
    </div>
  );
}
