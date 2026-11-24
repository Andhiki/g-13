import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useLocale } from "@/useLocale";
import { RatingStars } from "@/ui/rating-stars";
import { CourseChip } from "@/ui/course-chip";
import { Typography } from "@/ui/typography";
import type { lecturerDirectoryQueryOptions } from "../-client/queries";
import { courseDisplayName } from "../-shared/course-search";

export { RatingStars };

type Lecturer = Awaited<
  ReturnType<NonNullable<ReturnType<typeof lecturerDirectoryQueryOptions>["queryFn"]>>
>["lecturers"][number];

export function LecturerReviewCard({ lecturer }: { lecturer: Lecturer }) {
  const { text, language } = useLocale("lecturers");
  const [showAllCourses, setShowAllCourses] = useState(false);
  return (
    <article className="isolate relative cursor-pointer rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-3 transition-colors hover:border-stroke-strong-950 focus-within:border-stroke-strong-950 sm:p-4">
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
              className="m-0 break-words"
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
        <Typography as="p" variant="caption" color="muted" className="mb-0 mt-1">
          {lecturer.reviewCount === 0
            ? text("No reviews yet")
            : text(lecturer.reviewCount === 1 ? "{{count}} review" : "{{count}} reviews", {
                count: lecturer.reviewCount,
              })}
        </Typography>
        {lecturer.courses.length > 0 && (
          <ul
            aria-label={text("Courses reviewed")}
            className="mb-0 mt-2 flex min-w-0 flex-wrap items-center gap-1.5 pl-0"
          >
            {(showAllCourses ? lecturer.courses : lecturer.courses.slice(0, 3)).map((course) => (
              <li key={course.courseId} className="min-w-0 max-w-full">
                <CourseChip code={course.code} name={courseDisplayName(course, language)} />
              </li>
            ))}
            {lecturer.courses.length > 3 && (
              <li className="flex items-center">
                <button
                  type="button"
                  className="pointer-events-auto relative z-20 inline-flex items-center rounded-md bg-bg-weak-50 px-2 py-1 text-paragraph-xs text-text-sub-600 hover:text-text-strong-950 focus-visible:outline-2 focus-visible:outline-primary-base pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2 pointer-coarse:before:size-full pointer-coarse:before:min-h-11 pointer-coarse:before:min-w-11 pointer-coarse:before:-translate-x-1/2 pointer-coarse:before:-translate-y-1/2 pointer-coarse:before:content-['']"
                  aria-expanded={showAllCourses}
                  onClick={() => setShowAllCourses((current) => !current)}
                >
                  {showAllCourses
                    ? text("Show less")
                    : text("{{count}} more", {
                        count: lecturer.courses.length - 3,
                      })}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}
