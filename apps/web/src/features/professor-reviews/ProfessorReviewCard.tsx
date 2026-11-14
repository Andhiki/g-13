import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { RiArrowDownSLine, RiPencilLine, RiStarFill } from "@remixicon/react";
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
  const courses = [
    ...new Map(professor.reviews.map((review) => [review.courseId, review])).values(),
  ].sort((a, b) => a.code.localeCompare(b.code));
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
          {overall === null ? "?" : overall.toFixed(1)}
        </div>
      </div>
      {courses.length > 0 && (
        <ul aria-label={text("Courses reviewed")} className="mb-0 mt-3 flex flex-wrap gap-1.5 pl-0">
          {courses.map((course) => (
            <li
              key={course.courseId}
              className="flex min-w-0 max-w-full items-center gap-1.5 rounded-md bg-bg-weak-50 px-2 py-1"
            >
              <span className="shrink-0 font-mono text-paragraph-xs text-text-sub-600">
                {course.code}
              </span>
              <span className="truncate text-paragraph-xs">
                {courseDisplayName(course, language)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {professor.reviews.length ? (
          <AlignButton.Root
            variant="neutral"
            mode="ghost"
            className="size-11 p-0"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={`professor-reviews-${professor.id}`}
            aria-label={`${text(expanded ? "Hide reviews" : "Read reviews")} · ${professor.name}`}
            title={text(expanded ? "Hide reviews" : "Read reviews")}
          >
            <RiArrowDownSLine
              aria-hidden="true"
              className={`size-5 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
            />
          </AlignButton.Root>
        ) : (
          <span className="text-paragraph-xs text-text-sub-600">{text("No reviews yet")}</span>
        )}
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          className="size-11 p-0"
          onClick={onWrite}
          aria-label={`${text("Write a review")} · ${professor.name}`}
          title={text("Write a review")}
        >
          <RiPencilLine aria-hidden="true" className="size-5" />
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
                    <dl className="mb-0 mt-3 grid grid-cols-3 gap-2 rounded-lg bg-bg-weak-50 p-2.5">
                      {(
                        [
                          ["Clarity", review.clarity],
                          ["Support", review.support],
                          ["Organization", review.organization],
                        ] as const
                      ).map(([label, value]) => (
                        <div key={label} className="min-w-0 text-center">
                          <dt className="text-paragraph-xs text-text-sub-600">{text(label)}</dt>
                          <dd className="m-0 mt-0.5 flex items-center justify-center gap-1 text-label-xs">
                            <RiStarFill aria-hidden="true" className="size-3 text-primary-base" />
                            {value}/5
                          </dd>
                        </div>
                      ))}
                    </dl>
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
