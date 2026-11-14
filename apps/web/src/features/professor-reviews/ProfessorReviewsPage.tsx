import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RiArrowRightLine, RiCloseLine, RiSearchLine, RiStarFill } from "@remixicon/react";
import { useLocale } from "../../useLocale";
import { AlignFancyButton } from "../../ui/fancy-button";
import { Typography } from "../../ui/typography";
import { ProfessorReviewCard } from "./ProfessorReviewCard";
import { ReviewSubmissionForm, type ReviewDraft } from "./ReviewSubmissionForm";
import { ReviewSortMenu } from "./ReviewSortMenu";
import { orderProfessors, type ProfessorOrder, type ReviewOrder } from "./review-order";
import { searchProfessors } from "./professor-search";

type ReviewData = Awaited<ReturnType<typeof import("./repository").getPublicProfessorReviews>>;
const ratingDescriptions = [
  ["Clarity", "Clarity of explanations and examples."],
  ["Support", "Help and guidance when students need it."],
  ["Organization", "Structure of course materials and class activities."],
] as const;
export function ProfessorReviewsPage({ data }: { data: ReviewData }) {
  const router = useRouter();
  const { text } = useLocale("professors");
  const [query, setQuery] = useState("");
  const [professorOrder, setProfessorOrder] = useState<ProfessorOrder>("name");
  const [reviewOrder, setReviewOrder] = useState<ReviewOrder>("newest");
  const [expandedProfessorId, setExpandedProfessorId] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);
  const [reviewToFocus, setReviewToFocus] = useState<string | null>(null);
  const visibleProfessors = orderProfessors(
    searchProfessors(data.professors, data.courses, query),
    null,
    professorOrder,
    reviewOrder,
  );
  useEffect(() => {
    if (!reviewToFocus) return;
    const owner = data.professors.find((professor) =>
      professor.reviews.some((review) => review.id === reviewToFocus),
    );
    if (!owner) return;
    if (expandedProfessorId !== owner.id) {
      setExpandedProfessorId(owner.id);
      return;
    }
    const review = document.getElementById(`review-${reviewToFocus}`);
    if (!review) return;
    review.scrollIntoView({ block: "center" });
    review.focus({ preventScroll: true });
    setReviewToFocus(null);
  }, [data, expandedProfessorId, reviewToFocus]);
  const startReview = (professorId: string, courseId: string | null = null) =>
    setReviewDraft((current) => ({ professorId, courseId, request: (current?.request ?? 0) + 1 }));
  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-10 text-text-strong-950 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-24">
        <header className="lg:sticky lg:top-28 lg:self-start">
          <Typography as="h1" variant="title" className="m-0 text-title-h3 sm:text-title-h2">
            {text("Professors and reviews")}
          </Typography>
          <Typography as="p" variant="paragraph" className="mb-0 mt-5 max-w-md text-text-sub-600">
            {text("Browse community experiences with Ilmu Komputer UGM lecturers.")}
          </Typography>
          <AlignFancyButton.Root className="mt-6" onClick={() => startReview("")}>
            {text("Write a review")}
            <RiArrowRightLine aria-hidden="true" className="size-5" />
          </AlignFancyButton.Root>
          <section aria-labelledby="rating-guide" className="mt-8 max-w-md">
            <h2 id="rating-guide" className="m-0 text-label-sm">
              {text("Understanding the ratings")}
            </h2>
            <dl className="mb-0 mt-4 space-y-4">
              {ratingDescriptions.map(([label, description]) => (
                <div key={label}>
                  <dt className="text-label-sm">{text(label)}</dt>
                  <dd className="m-0 mt-1 text-paragraph-sm text-text-sub-600">
                    {text(description)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mb-0 mt-4 text-paragraph-xs text-text-sub-600">
              {text(
                "Overall ratings give equal weight to these three aspects. Scores range from 1 to 5.",
              )}
            </p>
          </section>
          <aside className="mt-6 max-w-md rounded-10 border border-stroke-soft-200 p-4">
            <div className="flex items-start gap-3">
              <RiStarFill aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary-base" />
              <div>
                <h2 className="m-0 text-label-sm">{text("Unverified reviews")}</h2>
                <p className="mb-0 mt-1 text-paragraph-xs text-text-sub-600">
                  {text(
                    "Reviews are shared by the community and do not prove course attendance. This is a community-run project, not an official university service.",
                  )}
                </p>
                <p className="mb-0 mt-1 text-paragraph-xs text-text-sub-600">
                  {text("Ratings summarize experiences and are not a definitive ranking.")}
                </p>
              </div>
            </div>
          </aside>
        </header>
        <div className="min-w-0">
          <ReviewSubmissionForm
            data={data}
            draft={reviewDraft}
            onPublished={async (reviewId) => {
              setQuery("");
              setReviewToFocus(reviewId);
              await router.invalidate({
                filter: (match) => match.routeId === "/professors",
                sync: true,
              });
            }}
          />
          <section aria-label={text("Search and sort")} className="mt-6">
            <div className="flex items-center gap-2">
              <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 focus-within:ring-2 focus-within:ring-primary-alpha-16">
                <span className="sr-only">{text("Search professors or courses")}</span>
                <RiSearchLine aria-hidden="true" className="size-5 shrink-0 text-text-sub-600" />
                <input
                  className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-text-soft-400 sm:text-paragraph-sm"
                  placeholder={text("Search professors or courses")}
                  aria-describedby="professor-search-hint"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setExpandedProfessorId(null);
                  }}
                />
                {query && (
                  <button
                    type="button"
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-sub-600 focus-visible:outline-2 focus-visible:outline-primary-base"
                    aria-label={text("Clear search")}
                    onClick={() => {
                      setQuery("");
                      setExpandedProfessorId(null);
                    }}
                  >
                    <RiCloseLine aria-hidden="true" className="size-4" />
                  </button>
                )}
              </label>
              <ReviewSortMenu
                professorOrder={professorOrder}
                reviewOrder={reviewOrder}
                onProfessorOrder={setProfessorOrder}
                onReviewOrder={setReviewOrder}
              />
            </div>
            <p id="professor-search-hint" className="mb-0 mt-2 text-paragraph-xs text-text-sub-600">
              {text("Try a name, course code, or a combination: Afiahayati di basis data.")}
            </p>
            {query.trim() && (
              <p role="status" className="mb-0 mt-2 text-paragraph-xs text-text-sub-600">
                {text(
                  "{{count}} professors. Course searches show ratings from matching published reviews.",
                  { count: visibleProfessors.length },
                )}
              </p>
            )}
          </section>
          <section aria-label={text("Professors and reviews")} className="mt-6 space-y-4">
            {visibleProfessors.length ? (
              visibleProfessors.map((professor) => (
                <ProfessorReviewCard
                  key={professor.id}
                  professor={professor}
                  expanded={expandedProfessorId === professor.id}
                  onToggle={() =>
                    setExpandedProfessorId((current) =>
                      current === professor.id ? null : professor.id,
                    )
                  }
                  onWrite={() =>
                    startReview(
                      professor.id,
                      query.trim() &&
                        new Set(professor.reviews.map((review) => review.courseId)).size === 1
                        ? professor.reviews[0].courseId
                        : null,
                    )
                  }
                />
              ))
            ) : (
              <div className="rounded-10 border border-dashed border-stroke-soft-200 px-6 py-10 text-center">
                <p className="m-0 text-paragraph-sm text-text-sub-600">
                  {text(
                    "No professors or reviewed courses match this search. Try another name or clear your search.",
                  )}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
