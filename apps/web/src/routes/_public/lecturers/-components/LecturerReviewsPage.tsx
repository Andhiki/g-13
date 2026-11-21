import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { RiCloseLine, RiSearchLine } from "@remixicon/react";
import { useLocale } from "@/useLocale";
import { Typography } from "@/ui/typography";
import { LecturerReviewCard } from "./LecturerReviewCard";
import { RatingGuidePopover } from "./RatingGuidePopover";
import { ReviewSortMenu } from "./ReviewSortMenu";
import { orderLecturers, type LecturerOrder } from "../-shared/review-order";
import { searchLecturers } from "../-shared/lecturer-search";
import { lecturerDirectoryQueryOptions } from "../-client/queries";

export function LecturerReviewsPage() {
  const { data } = useSuspenseQuery(lecturerDirectoryQueryOptions());
  const { text } = useLocale("lecturers");
  const [query, setQuery] = useState("");
  const [lecturerOrder, setLecturerOrder] = useState<LecturerOrder>("name");
  const visibleLecturers = orderLecturers(
    searchLecturers(data.lecturers, data.courses, query),
    lecturerOrder,
  );

  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-10 text-text-strong-950 sm:px-8 sm:py-12 lg:px-12">
      <div className="mx-auto grid max-w-4xl gap-6 sm:gap-8">
        <header>
          <div className="flex items-center gap-2">
            <Typography as="h1" variant="title" className="m-0">
              {text("Lecturers and reviews")}
            </Typography>
            <RatingGuidePopover />
          </div>
        </header>
        <div className="min-w-0">
          <section aria-label={text("Search and sort")}>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-10 min-w-32 sm:pointer-fine:h-9 flex-1 items-center gap-2 rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 focus-within:ring-2 focus-within:ring-primary-alpha-16">
                <span className="sr-only">{text("Search lecturers or courses")}</span>
                <RiSearchLine aria-hidden="true" className="size-5 shrink-0 text-text-sub-600" />
                <input
                  className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-text-soft-400 sm:pointer-fine:text-paragraph-sm"
                  placeholder={text("Lecturer or course")}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    className="relative flex size-8 shrink-0 items-center justify-center rounded-md text-text-sub-600 focus-visible:outline-2 focus-visible:outline-primary-base pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2 pointer-coarse:before:size-11 pointer-coarse:before:-translate-x-1/2 pointer-coarse:before:-translate-y-1/2 pointer-coarse:before:content-['']"
                    aria-label={text("Clear search")}
                    onClick={() => setQuery("")}
                  >
                    <RiCloseLine aria-hidden="true" className="size-4" />
                  </button>
                )}
              </label>
              <ReviewSortMenu
                kind="lecturer"
                value={lecturerOrder}
                onValueChange={setLecturerOrder}
              />
            </div>
            {query.trim() && (
              <Typography
                as="p"
                variant="caption"
                color="muted"
                role="status"
                className="mb-0 mt-2"
              >
                {text("{{count}} lecturers match this search.", { count: visibleLecturers.length })}
              </Typography>
            )}
          </section>
          <section
            aria-label={text("Lecturers and reviews")}
            className="mt-4 grid gap-3 sm:grid-cols-2"
          >
            {visibleLecturers.length ? (
              visibleLecturers.map((lecturer) => (
                <LecturerReviewCard key={lecturer.id} lecturer={lecturer} />
              ))
            ) : (
              <div className="rounded-10 border border-dashed sm:col-span-2 border-stroke-soft-200 px-6 py-10 text-center">
                <Typography as="p" variant="paragraph" color="muted" className="m-0">
                  {text(
                    "No lecturers or reviewed courses match this search. Try another name or clear your search.",
                  )}
                </Typography>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
