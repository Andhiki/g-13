import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { RiArrowRightLine, RiCloseLine, RiSearchLine } from "@remixicon/react";
import { useLocale } from "../../useLocale";
import { AlignFancyButton } from "../../ui/fancy-button";
import { Typography } from "../../ui/typography";
import { LecturerReviewCard } from "./LecturerReviewCard";
import { RatingGuidePopover } from "./RatingGuidePopover";
import { ReviewSubmissionDialog } from "./ReviewSubmissionDialog";
import type { ReviewDraft } from "./ReviewSubmissionForm";
import { ReviewSortMenu } from "./ReviewSortMenu";
import { orderLecturers, type LecturerOrder } from "./review-order";
import { searchLecturers } from "./lecturer-search";

type DirectoryData = Awaited<ReturnType<typeof import("./repository").getLecturerDirectory>>;

export function LecturerReviewsPage({ data }: { data: DirectoryData }) {
  const router = useRouter();
  const { text } = useLocale("lecturers");
  const [query, setQuery] = useState("");
  const [lecturerOrder, setLecturerOrder] = useState<LecturerOrder>("name");
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);
  const visibleLecturers = orderLecturers(
    searchLecturers(data.lecturers, data.courses, query),
    lecturerOrder,
  );
  const startReview = (lecturerId: string, courseId: string | null = null) =>
    setReviewDraft((current) => ({ lecturerId, courseId, request: (current?.request ?? 0) + 1 }));

  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-10 text-text-strong-950 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-24">
        <header className="lg:sticky lg:top-28 lg:self-start">
          <Typography as="h1" variant="title" className="m-0 text-title-h3 sm:text-title-h2">
            {text("Lecturers and reviews")}
          </Typography>
          <Typography as="p" variant="paragraph" className="mb-0 mt-5 max-w-md text-text-sub-600">
            {text("Browse community experiences with Ilmu Komputer UGM lecturers.")}
          </Typography>
          <div className="mt-6 flex items-center gap-2">
            <RatingGuidePopover />
            <AlignFancyButton.Root onClick={() => startReview("")}>
              {text("Write a review")}
              <RiArrowRightLine aria-hidden="true" className="size-5" />
            </AlignFancyButton.Root>
          </div>
        </header>
        <div className="min-w-0">
          <section aria-label={text("Search and sort")}>
            <div className="flex items-center gap-2">
              <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 focus-within:ring-2 focus-within:ring-primary-alpha-16">
                <span className="sr-only">{text("Search lecturers or courses")}</span>
                <RiSearchLine aria-hidden="true" className="size-5 shrink-0 text-text-sub-600" />
                <input
                  className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-text-soft-400 sm:text-paragraph-sm"
                  placeholder={text("Search lecturers or courses")}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-sub-600 focus-visible:outline-2 focus-visible:outline-primary-base"
                    aria-label={text("Clear search")}
                    onClick={() => setQuery("")}
                  >
                    <RiCloseLine aria-hidden="true" className="size-4" />
                  </button>
                )}
              </label>
              <ReviewSortMenu lecturerOrder={lecturerOrder} onLecturerOrder={setLecturerOrder} />
            </div>
            {query.trim() && (
              <Typography
                as="p"
                variant="caption"
                role="status"
                className="mb-0 mt-2 text-text-sub-600"
              >
                {text("{{count}} lecturers match this search.", { count: visibleLecturers.length })}
              </Typography>
            )}
          </section>
          <section aria-label={text("Lecturers and reviews")} className="mt-4 space-y-3">
            {visibleLecturers.length ? (
              visibleLecturers.map((lecturer) => (
                <LecturerReviewCard key={lecturer.id} lecturer={lecturer} />
              ))
            ) : (
              <div className="rounded-10 border border-dashed border-stroke-soft-200 px-6 py-10 text-center">
                <Typography as="p" variant="paragraph" className="m-0 text-text-sub-600">
                  {text(
                    "No lecturers or reviewed courses match this search. Try another name or clear your search.",
                  )}
                </Typography>
              </div>
            )}
          </section>
        </div>
      </div>
      <ReviewSubmissionDialog
        data={data}
        draft={reviewDraft}
        onClose={() => setReviewDraft(null)}
        onPublished={async () => {
          setReviewDraft(null);
          setQuery("");
          await router.invalidate({
            filter: (match) => match.routeId === "/lecturers/",
            sync: true,
          });
        }}
      />
    </main>
  );
}
