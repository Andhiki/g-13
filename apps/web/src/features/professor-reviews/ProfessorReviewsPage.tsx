import { useRouter } from "@tanstack/react-router";
import { ReviewSubmissionForm, type ReviewDraft } from "./ReviewSubmissionForm";
import { useEffect, useMemo, useState } from "react";
import { RiArrowRightLine, RiCloseLine, RiSearchLine, RiStarFill } from "@remixicon/react";
import { useLocale } from "../../useLocale";
import { AlignButton } from "../../ui/button";
import { AlignFancyButton } from "../../ui/fancy-button";
import { AlignSelect } from "../../ui/select";
import { orderProfessors, type ProfessorOrder, type ReviewOrder } from "./review-order";
import { Typography } from "../../ui/typography";
import { courseDisplayName, matchesCourseSearch } from "./course-search";

type ReviewData = Awaited<ReturnType<typeof import("./repository").getPublicProfessorReviews>>;

function average(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function ProfessorReviewsPage({ data }: { data: ReviewData }) {
  const router = useRouter();
  const [reviewToFocus, setReviewToFocus] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);
  const { text, language } = useLocale("professors");
  const [professorQuery, setProfessorQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [professorOrder, setProfessorOrder] = useState<ProfessorOrder>("name");
  const [reviewOrder, setReviewOrder] = useState<ReviewOrder>("newest");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (!reviewToFocus) return;
    const review = document.getElementById(`review-${reviewToFocus}`);
    if (!review) return;
    review.scrollIntoView({ block: "center" });
    review.focus({ preventScroll: true });
    setReviewToFocus(null);
  }, [data, reviewToFocus]);

  const selectedCourse = data.courses.find((course) => course.id === selectedCourseId) ?? null;
  const courseMatches = useMemo(
    () =>
      courseQuery.trim()
        ? data.courses.filter((course) => matchesCourseSearch(course, courseQuery)).slice(0, 8)
        : [],
    [courseQuery, data.courses],
  );
  const visibleProfessors = orderProfessors(
    data.professors.filter((professor) =>
      professor.name.toLocaleLowerCase().includes(professorQuery.trim().toLocaleLowerCase()),
    ),
    selectedCourseId,
    professorOrder,
    reviewOrder,
  );

  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-10 text-text-strong-950 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-24">
        <header className="lg:sticky lg:top-28 lg:self-start">
          <Typography
            as="p"
            variant="labelSmall"
            className="mb-3 uppercase tracking-[0.14em] text-primary-base"
          >
            UGM · ILMU KOMPUTER
          </Typography>
          <Typography as="h1" variant="title" className="m-0 text-title-h3 sm:text-title-h2">
            {text("Professors and reviews")}
          </Typography>
          <Typography as="p" variant="paragraph" className="mb-0 mt-5 max-w-md text-text-sub-600">
            {text("Browse community experiences with Ilmu Komputer UGM lecturers.")}
          </Typography>
          <AlignFancyButton.Root
            className="mt-6"
            onClick={() =>
              setReviewDraft((current) => ({
                professorId: "",
                courseId: selectedCourseId,
                request: (current?.request ?? 0) + 1,
              }))
            }
          >
            {text("Write a review")}
            <RiArrowRightLine aria-hidden="true" className="size-5" />
          </AlignFancyButton.Root>
          <aside className="mt-8 max-w-md rounded-10 border border-stroke-soft-200 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full bg-primary-base p-1 text-white">
                <RiStarFill aria-hidden="true" className="size-4" />
              </span>
              <div>
                <Typography as="h2" variant="label" className="m-0">
                  {text("Unverified reviews")}
                </Typography>
                <Typography as="p" variant="caption" className="mb-0 mt-1 text-text-sub-600">
                  {text(
                    "Reviews are shared by the community and do not prove course attendance. This is a community-run project, not an official university service.",
                  )}
                </Typography>
                <Typography as="p" variant="caption" className="mb-0 mt-1 text-text-sub-600">
                  {text("Ratings summarize experiences and are not a definitive ranking.")}
                </Typography>
              </div>
            </div>
          </aside>
        </header>
        <div className="min-w-0">
          <ReviewSubmissionForm
            data={data}
            draft={reviewDraft}
            onPublished={async (reviewId) => {
              setProfessorQuery("");
              setSelectedCourseId(null);
              setCourseQuery("");
              setReviewToFocus(reviewId);
              await router.invalidate({
                filter: (match) => match.routeId === "/professors",
                sync: true,
              });
            }}
          />

          <section aria-label={text("Professor search")} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <Typography as="span" variant="label" className="mb-2 block">
                {text("Search professors")}
              </Typography>
              <span className="flex h-12 items-center gap-3 rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-4 focus-within:border-primary-base focus-within:ring-2 focus-within:ring-primary-alpha-16">
                <RiSearchLine aria-hidden="true" className="size-5 shrink-0 text-text-soft-400" />
                <input
                  aria-label={text("Search a professor by name")}
                  className="min-w-0 flex-1 bg-transparent text-paragraph-sm outline-none placeholder:text-text-soft-400"
                  placeholder={text("Search a professor by name")}
                  value={professorQuery}
                  onChange={(event) => setProfessorQuery(event.target.value)}
                />
              </span>
            </label>

            <div className="relative">
              <label className="block">
                <Typography as="span" variant="label" className="mb-2 block">
                  {text("Search courses")}
                </Typography>
                <span className="flex h-12 items-center gap-3 rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-4 focus-within:border-primary-base focus-within:ring-2 focus-within:ring-primary-alpha-16">
                  <RiSearchLine aria-hidden="true" className="size-5 shrink-0 text-text-soft-400" />
                  <input
                    aria-label={text("Search by course code or name")}
                    className="min-w-0 flex-1 bg-transparent text-paragraph-sm outline-none placeholder:text-text-soft-400"
                    placeholder={text("Search by course code or name")}
                    value={courseQuery}
                    onChange={(event) => setCourseQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && courseMatches[0]) {
                        event.preventDefault();
                        setSelectedCourseId(courseMatches[0].id);
                        setCourseQuery("");
                      }
                    }}
                  />
                  {courseQuery && (
                    <button
                      aria-label={text("Clear course filter")}
                      className="rounded p-1 text-text-sub-600 hover:bg-bg-weak-50"
                      onClick={() => setCourseQuery("")}
                      type="button"
                    >
                      <RiCloseLine aria-hidden="true" className="size-4" />
                    </button>
                  )}
                </span>
              </label>
              {courseQuery && (
                <div className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-1 shadow-lg">
                  {courseMatches.length ? (
                    courseMatches.map((course) => (
                      <button
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-bg-weak-50 focus-visible:outline-2 focus-visible:outline-primary-base"
                        key={course.id}
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setCourseQuery("");
                        }}
                        type="button"
                      >
                        <span className="min-w-0 truncate text-paragraph-sm">
                          {courseDisplayName(course, language)}
                        </span>
                        <span className="shrink-0 font-mono text-paragraph-xs text-text-sub-600">
                          {course.code}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="m-0 px-3 py-3 text-paragraph-sm text-text-sub-600">
                      {text("No courses match this search.")}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="professor-order" className="mb-2 block text-label-sm">
                {text("Professor order")}
              </label>
              <AlignSelect.Root
                value={professorOrder}
                onValueChange={(value) => setProfessorOrder(value as ProfessorOrder)}
              >
                <AlignSelect.Trigger id="professor-order" className="min-h-11">
                  <AlignSelect.Value />
                </AlignSelect.Trigger>
                <AlignSelect.Content>
                  <AlignSelect.Item value="name">{text("Name A–Z")}</AlignSelect.Item>
                  <AlignSelect.Item value="review-count">{text("Most reviews")}</AlignSelect.Item>
                  <AlignSelect.Item value="rating">{text("Highest rating")}</AlignSelect.Item>
                </AlignSelect.Content>
              </AlignSelect.Root>
            </div>
            <div>
              <label htmlFor="review-order" className="mb-2 block text-label-sm">
                {text("Review order")}
              </label>
              <AlignSelect.Root
                value={reviewOrder}
                onValueChange={(value) => setReviewOrder(value as ReviewOrder)}
              >
                <AlignSelect.Trigger id="review-order" className="min-h-11">
                  <AlignSelect.Value />
                </AlignSelect.Trigger>
                <AlignSelect.Content>
                  <AlignSelect.Item value="newest">{text("Newest first")}</AlignSelect.Item>
                  <AlignSelect.Item value="oldest">{text("Oldest first")}</AlignSelect.Item>
                  <AlignSelect.Item value="highest">{text("Highest rating")}</AlignSelect.Item>
                  <AlignSelect.Item value="lowest">{text("Lowest rating")}</AlignSelect.Item>
                </AlignSelect.Content>
              </AlignSelect.Root>
            </div>
          </section>

          {selectedCourse && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-bg-weak-50 px-3 py-1.5 text-paragraph-xs text-text-sub-600">
                {text("Course filter")}:{" "}
                <strong className="text-text-strong-950">
                  {courseDisplayName(selectedCourse, language)}
                </strong>
                <span className="ml-2 font-mono">{selectedCourse.code}</span>
              </span>
              <AlignButton.Root
                aria-label={text("Clear course filter")}
                className="size-8 p-1.5"
                mode="ghost"
                onClick={() => setSelectedCourseId(null)}
                variant="neutral"
              >
                <RiCloseLine aria-hidden="true" className="size-4" />
              </AlignButton.Root>
            </div>
          )}

          <section aria-label={text("Professors and reviews")} className="mt-8">
            {visibleProfessors.length ? (
              <div className="grid gap-4">
                {visibleProfessors.map((professor) => {
                  const shownReviews = professor.reviews;
                  const overall = average(shownReviews.map((review) => review.overall));
                  const clarity = average(shownReviews.map((review) => review.clarity));
                  const support = average(shownReviews.map((review) => review.support));
                  const organization = average(shownReviews.map((review) => review.organization));
                  const metricRows: { label: string; value: number | null }[] = [
                    { label: "Clarity", value: clarity },
                    { label: "Support", value: support },
                    { label: "Organization", value: organization },
                  ];
                  return (
                    <article
                      className="rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-5 sm:p-6"
                      key={professor.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Typography as="h2" variant="subtitle1" className="m-0 truncate">
                            {professor.name}
                          </Typography>
                          <Typography
                            as="p"
                            variant="caption"
                            className="mb-0 mt-1 text-text-sub-600"
                          >
                            {text("{{count}} reviews", { count: shownReviews.length })}
                          </Typography>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-bg-weak-50 px-3 py-1.5 text-label-sm">
                          <RiStarFill aria-hidden="true" className="size-4 text-primary-base" />
                          {overall === null ? "—" : overall.toFixed(1)}
                        </div>
                      </div>

                      <AlignButton.Root
                        type="button"
                        mode="ghost"
                        variant="neutral"
                        className="mt-3 min-h-11"
                        onClick={() =>
                          setReviewDraft((current) => ({
                            professorId: professor.id,
                            courseId: selectedCourseId,
                            request: (current?.request ?? 0) + 1,
                          }))
                        }
                      >
                        {text("Write a review")}
                        <span className="sr-only"> · {professor.name}</span>
                      </AlignButton.Root>
                      {shownReviews.length ? (
                        <>
                          <dl className="mt-5 grid grid-cols-3 gap-2 rounded-lg bg-bg-weak-50 p-3 text-center">
                            {metricRows.map(({ label, value }) => (
                              <div key={label as string}>
                                <dt className="text-paragraph-xs text-text-sub-600">
                                  {text(label)}
                                </dt>
                                <dd className="m-0 mt-1 text-label-sm">
                                  {value === null ? "—" : value.toFixed(1)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                          <div className="mt-4 space-y-3">
                            {shownReviews.map((review) => (
                              <article
                                className="rounded-lg border border-stroke-soft-200 p-4"
                                key={review.id}
                                id={`review-${review.id}`}
                                tabIndex={-1}
                              >
                                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                  <Typography as="strong" variant="label">
                                    {review.authorName.toLowerCase() === "anonymous"
                                      ? text("Anonymous")
                                      : review.authorName}
                                  </Typography>
                                  <time className="text-paragraph-xs text-text-sub-600">
                                    {review.termLabel}
                                  </time>
                                </div>
                                <Typography
                                  as="p"
                                  variant="caption"
                                  className="mb-0 mt-1 text-text-sub-600"
                                >
                                  {courseDisplayName(review, language)} · {review.code}
                                </Typography>
                                <p className="mb-0 mt-3 whitespace-pre-wrap text-paragraph-sm leading-relaxed">
                                  {review.body}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-paragraph-xs text-text-sub-600">
                                  <span>
                                    {text("Clarity")}: {review.clarity}/5
                                  </span>
                                  <span>
                                    {text("Support")}: {review.support}/5
                                  </span>
                                  <span>
                                    {text("Organization")}: {review.organization}/5
                                  </span>
                                </div>
                              </article>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="mt-5 rounded-lg bg-bg-weak-50 px-4 py-5 text-center">
                          <Typography as="p" variant="label" className="m-0">
                            {selectedCourseId
                              ? text("No reviews for this course")
                              : text("No reviews yet")}
                          </Typography>
                          {overall === null && (
                            <Typography
                              as="p"
                              variant="caption"
                              className="mb-0 mt-1 text-text-sub-600"
                            >
                              {text(
                                "Ratings summarize experiences and are not a definitive ranking.",
                              )}
                            </Typography>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-10 border border-dashed border-stroke-soft-200 px-6 py-12 text-center">
                <Typography as="p" variant="label" className="m-0 text-text-sub-600">
                  {text("No professors match this search.")}
                </Typography>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
