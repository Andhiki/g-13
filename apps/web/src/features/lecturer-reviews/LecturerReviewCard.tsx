import { RiStarFill } from "@remixicon/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useLocale } from "../../useLocale";
import { Typography } from "../../ui/typography";
import { courseDisplayName } from "./course-search";

type Lecturer = Awaited<
  ReturnType<typeof import("./repository").getLecturerDirectory>
>["lecturers"][number];

export function LecturerReviewCard({ lecturer }: { lecturer: Lecturer }) {
  const { text, language } = useLocale("lecturers");
  const [showAllCourses, setShowAllCourses] = useState(false);
  return (
    <article className="group isolate relative cursor-pointer rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-3 transition-colors hover:border-stroke-strong-950 sm:p-4">
      <Link
        to="/lecturers/$lecturerId"
        params={{ lecturerId: lecturer.id }}
        aria-labelledby={`lecturer-card-name-${lecturer.id}`}
        className="absolute inset-0 z-0 rounded-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-base"
      />
      <div className="pointer-events-none relative z-10">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <Typography
              as="h2"
              variant="subtitle2"
              id={`lecturer-card-name-${lecturer.id}`}
              className="m-0 break-words underline decoration-1 underline-offset-4 group-hover:decoration-2"
            >
              {lecturer.name}
            </Typography>
          </div>
          <RatingStars
            value={lecturer.overallAverage}
            label={text("Overall rating: {{rating}}", {
              rating:
                lecturer.overallAverage === null
                  ? text("Not rated")
                  : `${lecturer.overallAverage.toFixed(1)}/5`,
            })}
          />
        </div>
        <Typography as="p" variant="caption" className="mb-0 mt-1 text-text-sub-600">
          {text(lecturer.reviewCount === 1 ? "{{count}} review" : "{{count}} reviews", {
            count: lecturer.reviewCount,
          })}
        </Typography>
        {lecturer.courses.length > 0 && (
          <ul
            aria-label={text("Courses reviewed")}
            className="mb-0 mt-2 flex min-w-0 flex-wrap gap-1.5 pl-0"
          >
            {(showAllCourses ? lecturer.courses : lecturer.courses.slice(0, 3)).map((course) => (
              <li
                key={course.courseId}
                className="flex min-w-0 max-w-full items-center gap-1.5 rounded-md bg-bg-weak-50 px-2 py-1"
              >
                <Typography as="span" variant="code" className="shrink-0 text-text-sub-600">
                  {course.code}
                </Typography>
                <Typography as="span" variant="caption" className="truncate">
                  {courseDisplayName(course, language)}
                </Typography>
              </li>
            ))}
            {lecturer.courses.length > 3 && (
              <li className="flex items-center">
                <button
                  type="button"
                  className="pointer-events-auto relative z-20 rounded px-1 py-1 text-paragraph-xs text-text-sub-600 hover:text-text-strong-950 focus-visible:outline-2 focus-visible:outline-primary-base"
                  aria-expanded={showAllCourses}
                  onClick={() => setShowAllCourses((current) => !current)}
                >
                  {showAllCourses
                    ? text("Show less")
                    : text("{{count}} more", { count: lecturer.courses.length - 3 })}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}

export function RatingStars({ value, label }: { value: number | null; label: string }) {
  return (
    <span role="img" aria-label={label} className="inline-flex shrink-0 gap-0.5 align-middle">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className="relative block size-4" aria-hidden="true">
          <RiStarFill className="size-full text-text-disabled-300" />
          <span
            className="absolute inset-y-0 left-0 overflow-hidden text-primary-base"
            style={{ width: `${Math.max(0, Math.min(1, (value ?? 0) - index)) * 100}%` }}
          >
            <RiStarFill className="size-4 max-w-none" />
          </span>
        </span>
      ))}
    </span>
  );
}
