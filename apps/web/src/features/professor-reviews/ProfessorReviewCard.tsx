import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { RiArrowDownSLine, RiStarFill } from "@remixicon/react";
import { AlignButton } from "../../ui/button";
import { useLocale } from "../../useLocale";
import { courseDisplayName } from "./course-search";

type Professor = Awaited<
  ReturnType<typeof import("./repository").getPublicProfessorReviews>
>["professors"][number];
function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}
export function ProfessorReviewCard({
  professor,
  expanded,
  onToggle,
  onWrite,
}: {
  professor: Professor;
  expanded: boolean;
  onToggle: () => void;
  onWrite: () => void;
}) {
  const { text, language } = useLocale("professors");
  const reducedMotion = useReducedMotion();
  const metrics = [
    { label: "Clarity", value: average(professor.reviews.map((review) => review.clarity)) },
    { label: "Support", value: average(professor.reviews.map((review) => review.support)) },
    {
      label: "Organization",
      value: average(professor.reviews.map((review) => review.organization)),
    },
  ];
  const overall = average(professor.reviews.map((review) => review.overall));
  return (
    <article className="rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 break-words text-label-lg">{professor.name}</h2>
          <p className="mb-0 mt-1 text-paragraph-xs text-text-sub-600">
            {text("{{count}} reviews", { count: professor.reviews.length })}
          </p>
        </div>
        <div
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-bg-weak-50 px-3 py-1.5 text-label-sm"
          aria-label={text("Overall rating: {{rating}}", {
            rating: overall === null ? text("Not rated") : `${overall.toFixed(1)}/5`,
          })}
        >
          <RiStarFill aria-hidden="true" className="size-4 text-primary-base" />
          {overall === null ? "—" : overall.toFixed(1)}
        </div>
      </div>
      <dl className="mb-0 mt-4 grid gap-2 rounded-lg bg-bg-weak-50 p-3 sm:grid-cols-3 sm:text-center">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between gap-3 sm:block">
            <dt className="text-paragraph-xs text-text-sub-600">{text(metric.label)}</dt>
            <dd className="m-0 text-label-sm sm:mt-1">
              {metric.value === null ? "—" : metric.value.toFixed(1)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {professor.reviews.length ? (
          <AlignButton.Root
            variant="neutral"
            mode="ghost"
            className="min-h-11 gap-2"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={`professor-reviews-${professor.id}`}
          >
            {text(expanded ? "Hide reviews" : "Read reviews")}
            <span className="sr-only"> · {professor.name}</span>
            <RiArrowDownSLine
              aria-hidden="true"
              className={`size-4 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
            />
          </AlignButton.Root>
        ) : (
          <span className="text-paragraph-xs text-text-sub-600">{text("No reviews yet")}</span>
        )}
        <AlignButton.Root variant="neutral" mode="ghost" className="min-h-11" onClick={onWrite}>
          {text("Write a review")}
          <span className="sr-only"> · {professor.name}</span>
        </AlignButton.Root>
      </div>
      <div id={`professor-reviews-${professor.id}`}>
        <AnimatePresence initial={false}>
          {expanded && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-3">
                {professor.reviews.map((review) => (
                  <article
                    key={review.id}
                    id={`review-${review.id}`}
                    tabIndex={-1}
                    className="rounded-lg border border-stroke-soft-200 p-4 focus-visible:outline-2 focus-visible:outline-primary-base"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <strong className="text-label-sm">
                        {review.authorName.toLowerCase() === "anonymous"
                          ? text("Anonymous")
                          : review.authorName}
                      </strong>
                      <time className="text-paragraph-xs text-text-sub-600">
                        {review.termLabel}
                      </time>
                    </div>
                    <p className="mb-0 mt-1 text-paragraph-xs text-text-sub-600">
                      {courseDisplayName(review, language)} · {review.code}
                    </p>
                    <p className="mb-0 mt-3 whitespace-pre-wrap break-words text-paragraph-sm leading-relaxed">
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
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}
