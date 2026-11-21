import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { RiArrowLeftLine, RiArrowRightLine, RiChatQuoteLine, RiStarFill } from "@remixicon/react";
import { CourseChip } from "@/ui/course-chip";
import { useLocale } from "@/useLocale";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignEmptyState } from "@/ui/empty-state";
import { AlignButton } from "@/ui/button";
import { AlignSelect } from "@/ui/select";
import { Typography } from "@/ui/typography";
import { toast, SuccessToast } from "@/ui/toast";
import { ReviewSubmissionDialog } from "./ReviewSubmissionDialog";
import { RatingGuidePopover } from "./RatingGuidePopover";
import { ReviewList } from "./ReviewList";
import { ReviewSortMenu } from "./ReviewSortMenu";
import { RatingStars } from "./LecturerReviewCard";
import { courseDisplayName } from "../-shared/course-search";
import { filterReviewsByCourse, orderReviews, type ReviewOrder } from "../-shared/review-order";
import { lecturerBrowserLikesQueryOptions, lecturerDetailQueryOptions } from "../-client/queries";
import { updateReviewLikeMutationOptions } from "../-client/mutations";

export function LecturerDetailPage({ lecturerId }: { lecturerId: string }) {
  const { data } = useSuspenseQuery(lecturerDetailQueryOptions(lecturerId));
  const { text, language } = useLocale("lecturers");
  const queryClient = useQueryClient();
  const courseFilterId = useId();
  const overall = data.lecturer.overallAverage;
  const [browserId, setBrowserId] = useState<string | null>(null);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<ReviewOrder>("newest");
  const [courseId, setCourseId] = useState<string | null>(null);
  const selectedCourse = data.lecturer.courses.find(({ id }) => id === courseId);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const likesQuery = useQuery({
    ...lecturerBrowserLikesQueryOptions(browserId ?? ""),
    enabled: browserId !== null,
  });
  const likeMutation = useMutation(updateReviewLikeMutationOptions(queryClient));
  const likedReviews = likesQuery.data ?? [];
  const reviews = orderReviews(filterReviewsByCourse(data.reviews, courseId), reviewOrder);
  useEffect(() => {
    try {
      const key = "lecturer-review-browser-id";
      const id = localStorage.getItem(key) || crypto.randomUUID();
      localStorage.setItem(key, id);
      setBrowserId(id);
    } catch {
      setStorageUnavailable(true);
    }
  }, []);
  const likeError = storageUnavailable
    ? text("Enable browser storage to like reviews.")
    : likesQuery.isError || likeMutation.isError
      ? text("Could not update like. Please try again.")
      : "";

  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-5 text-text-strong-950 sm:px-8 sm:py-12 lg:px-12 lg:py-8">
      <div className="mx-auto max-w-4xl">
        <LinkBack />
        <header className="mt-3 sm:mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-1 basis-48 items-center gap-2">
              <Typography as="h1" variant="subtitle1" className="m-0 min-w-0">
                {data.lecturer.name}
              </Typography>
              <RatingGuidePopover />
            </div>
            <div className="flex items-center gap-2">
              <RatingStars
                value={overall}
                label={text("Overall rating: {{rating}}", {
                  rating: overall === null ? text("Not rated") : `${overall.toFixed(1)}/5`,
                })}
              />
              {overall !== null && (
                <Typography as="span" variant="label" className="tabular-nums" aria-hidden="true">
                  {overall.toFixed(1)}
                </Typography>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AlignFancyButton.Root
              compact
              className="h-9"
              onClick={() => setReviewDialogOpen(true)}
            >
              <Typography as="span" variant="paragraph">
                {text("Write a review")}
              </Typography>
              <RiArrowRightLine aria-hidden="true" className="size-4" />
            </AlignFancyButton.Root>
            <Typography as="span" variant="caption" color="muted">
              {text(data.lecturer.reviewCount === 1 ? "{{count}} review" : "{{count}} reviews", {
                count: data.lecturer.reviewCount,
              })}
            </Typography>
          </div>
        </header>

        <section aria-label={text("Courses reviewed")} className="mt-4 sm:mt-6">
          <Typography as="h2" variant="subtitle2" className="mb-0">
            {text("Courses reviewed")}
          </Typography>
          {data.lecturer.courses.length ? (
            <ul className="mb-0 mt-2 flex flex-wrap gap-1.5 pl-0">
              {data.lecturer.courses.map((course) => (
                <li key={course.id} className="min-w-0 max-w-full">
                  <CourseChip code={course.code} name={courseDisplayName(course, language)} />
                </li>
              ))}
            </ul>
          ) : (
            <Typography as="p" variant="paragraph" color="muted" className="mb-0 mt-2">
              {text("No reviews yet. Be the first to share your experience.")}
            </Typography>
          )}
        </section>

        <section aria-label={text("Average ratings")} className="mt-4 sm:mt-6">
          <Typography as="h2" variant="subtitle2" className="mb-0">
            {text("Average ratings")}
          </Typography>
          <dl className="mb-0 mt-3 grid max-w-lg gap-x-3 gap-y-2.5 [grid-template-columns:auto_minmax(0,1fr)_auto]">
            {(
              [
                ["Clarity", data.lecturer.clarityAverage],
                ["Support", data.lecturer.supportAverage],
                ["Organization", data.lecturer.organizationAverage],
              ] satisfies [string, number | null][]
            ).map(([label, value]) => (
              <div key={label} className="col-span-3 grid grid-cols-subgrid items-center">
                <Typography as="dt" variant="label" color="muted">
                  {text(label)}
                </Typography>
                <dd className="col-span-2 m-0 grid grid-cols-subgrid items-center">
                  <div
                    aria-hidden="true"
                    className="h-1.5 overflow-hidden rounded-full bg-bg-soft-200"
                  >
                    <div
                      className="h-full rounded-full bg-primary-base"
                      style={{ width: `${((value ?? 0) / 5) * 100}%` }}
                    />
                  </div>
                  <span className="flex items-center justify-end gap-1 text-label-sm tabular-nums">
                    {value === null ? (
                      <>
                        <span className="sr-only">{text("Not rated")}</span>
                        <span aria-hidden="true">—</span>
                      </>
                    ) : (
                      <>
                        {value.toFixed(1)}
                        <RiStarFill aria-hidden="true" className="size-4 text-primary-base" />
                      </>
                    )}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-label={text("Reviews")} className="mt-4 sm:mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Typography as="h2" variant="subtitle2" className="mb-0">
              {text("Reviews")}
            </Typography>
            <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
              <Typography
                as="label"
                variant="labelSmall"
                htmlFor={courseFilterId}
                className="sr-only sm:not-sr-only sm:shrink-0"
              >
                <span className="sm:text-text-sub-600">{text("Course")}</span>
              </Typography>
              <AlignSelect.Root
                variant="compact"
                value={courseId ?? "all"}
                onValueChange={(value) => setCourseId(value === "all" ? null : value)}
              >
                <AlignSelect.Trigger
                  id={courseFilterId}
                  aria-label={text("Course filter")}
                  className="h-9 min-h-9 max-w-44 flex-1 sm:flex-none"
                >
                  <span className="min-w-0 truncate">
                    <AlignSelect.Value>
                      {selectedCourse
                        ? `${selectedCourse.code} · ${courseDisplayName(selectedCourse, language)}`
                        : text("All courses")}
                    </AlignSelect.Value>
                  </span>
                </AlignSelect.Trigger>
                <AlignSelect.Content className="w-[min(20rem,var(--radix-select-content-available-width))] max-w-[calc(100vw-1rem)]">
                  <AlignSelect.Item value="all">{text("All courses")}</AlignSelect.Item>
                  {data.lecturer.courses.map((course) => (
                    <AlignSelect.Item key={course.id} value={course.id}>
                      <span className="min-w-0 wrap-anywhere whitespace-normal">
                        {course.code} · {courseDisplayName(course, language)}
                      </span>
                    </AlignSelect.Item>
                  ))}
                </AlignSelect.Content>
              </AlignSelect.Root>
              <ReviewSortMenu kind="review" value={reviewOrder} onValueChange={setReviewOrder} />
            </div>
          </div>
          {likeError && (
            <Typography as="p" variant="paragraph" color="danger" role="alert" className="mb-3">
              {likeError}
            </Typography>
          )}
          <ReviewList
            reviews={reviews}
            language={language}
            emptyState={
              <AlignEmptyState.Root align="center">
                <AlignEmptyState.Icon>
                  <RiChatQuoteLine />
                </AlignEmptyState.Icon>
                <AlignEmptyState.Title>
                  {text(courseId === null ? "No reviews yet" : "No reviews for this course")}
                </AlignEmptyState.Title>
                <AlignEmptyState.Description>
                  {text("Share an experience to help other students choose their classes.")}
                </AlignEmptyState.Description>
                <AlignEmptyState.Actions>
                  <AlignFancyButton.Root
                    compact
                    className="h-9"
                    onClick={() => setReviewDialogOpen(true)}
                  >
                    <Typography as="span" variant="paragraph">
                      {text("Write a review")}
                    </Typography>
                    <RiArrowRightLine aria-hidden="true" className="size-4" />
                  </AlignFancyButton.Root>
                  {courseId !== null && (
                    <AlignButton.Root
                      variant="neutral"
                      mode="ghost"
                      size="small"
                      onClick={() => setCourseId(null)}
                    >
                      {text("Clear course filter")}
                    </AlignButton.Root>
                  )}
                </AlignEmptyState.Actions>
              </AlignEmptyState.Root>
            }
            likedReviews={likedReviews}
            canLike={browserId !== null && !likesQuery.isPending && !likesQuery.isError}
            likePending={likeMutation.isPending}
            onLike={async (reviewId, liked) => {
              if (!browserId) return;
              await likeMutation
                .mutateAsync({ reviewId, browserId, lecturerId, liked })
                .catch(() => undefined);
            }}
          />
        </section>
      </div>
      <ReviewSubmissionDialog
        initialCourse={
          courseId ? data.lecturer.courses.find(({ id }) => id === courseId) : undefined
        }
        lecturerId={data.lecturer.id}
        lecturerName={data.lecturer.name}
        courseId={courseId ?? ""}
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        onPublished={async () => {
          setReviewDialogOpen(false);
          toast.custom(() => <SuccessToast message={text("Your review is published.")} />);
        }}
      />
    </main>
  );
}

function LinkBack() {
  const { text } = useLocale("lecturers");
  return (
    <Link
      to="/lecturers"
      className="inline-flex h-9 items-center gap-2 rounded-md text-label-sm text-text-sub-600 hover:text-text-strong-950 focus-visible:outline-2 focus-visible:outline-primary-base"
    >
      <RiArrowLeftLine aria-hidden="true" className="size-4" />
      <Typography as="span" variant="label">
        {text("Back to lecturers")}
      </Typography>
    </Link>
  );
}
