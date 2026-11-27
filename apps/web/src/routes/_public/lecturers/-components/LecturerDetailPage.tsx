import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { RiArrowLeftLine, RiStarFill } from "@remixicon/react";
import { CourseChip } from "@/ui/course-chip";
import { useLocale } from "@/useLocale";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignEmptyState } from "@/ui/empty-state";
import { AlignButton } from "@/ui/button";
import { AlignSelect } from "@/ui/select";
import { AlignModal } from "@/ui/modal";
import { Typography } from "@/ui/typography";
import { toast, SuccessToast } from "@/ui/toast";
import { ReviewSubmissionDialog } from "./ReviewSubmissionDialog";
import { RatingGuidePopover } from "./RatingGuidePopover";
import { ReviewList } from "./ReviewList";
import { ReviewSortMenu } from "./ReviewSortMenu";
import { RatingStars } from "./LecturerReviewCard";
import { courseDisplayName } from "../-shared/course-search";
import { filterReviewsByCourse, orderReviews, type ReviewOrder } from "../-shared/review-order";
import {
  lecturerBrowserLikesQueryOptions,
  lecturerDetailQueryOptions,
  ownPendingReviewsQueryOptions,
} from "../-client/queries";
import { readPendingReviewIds, writePendingReviewIds } from "../-client/pending-review-storage";
import { updateReviewLikeMutationOptions } from "../-client/mutations";

type LecturerDetail = ReturnType<
  typeof useSuspenseQuery<
    Awaited<ReturnType<NonNullable<ReturnType<typeof lecturerDetailQueryOptions>["queryFn"]>>>
  >
>["data"];

function LecturerDetailHeader({
  lecturer,
  onWriteReview,
}: {
  lecturer: LecturerDetail["lecturer"];
  onWriteReview: () => void;
}) {
  const { text } = useLocale("lecturers");
  const overall = lecturer.overallAverage;
  return (
    <header className="mt-3 sm:mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 basis-48 items-center gap-2">
          <Typography as="h1" variant="subtitle1" className="m-0 min-w-0">
            {lecturer.name}
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
        <AlignFancyButton.Root compact className="h-9" onClick={onWriteReview}>
          <Typography as="span" variant="paragraph">
            {text("Write a review")}
          </Typography>
        </AlignFancyButton.Root>
        <Typography as="span" variant="caption" color="muted">
          {text(lecturer.reviewCount === 1 ? "{{count}} review" : "{{count}} reviews", {
            count: lecturer.reviewCount,
          })}
        </Typography>
      </div>
    </header>
  );
}

function ReviewedCoursesSection({ courses }: { courses: LecturerDetail["lecturer"]["courses"] }) {
  const { text, language } = useLocale("lecturers");
  return (
    <section aria-label={text("Courses reviewed")} className="mt-4 sm:mt-6">
      <Typography as="h2" variant="subtitle2" className="mb-0">
        {text("Courses reviewed")}
      </Typography>
      {courses.length ? (
        <ul className="mb-0 mt-2 flex flex-wrap gap-1.5 pl-0">
          {courses.map((course) => (
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
  );
}

function AverageRatingRow({ label, value }: { label: string; value: number | null }) {
  const { text } = useLocale("lecturers");
  return (
    <div className="col-span-3 grid grid-cols-subgrid items-center">
      <Typography as="dt" variant="label" color="muted">
        {text(label)}
      </Typography>
      <dd className="col-span-2 m-0 grid grid-cols-subgrid items-center">
        <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-bg-soft-200">
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
  );
}

function AverageRatingsSection({ lecturer }: { lecturer: LecturerDetail["lecturer"] }) {
  const { text } = useLocale("lecturers");
  const rows: [string, number | null][] = [
    ["Clarity", lecturer.clarityAverage],
    ["Support", lecturer.supportAverage],
    ["Organization", lecturer.organizationAverage],
  ];
  return (
    <section aria-label={text("Average ratings")} className="mt-4 sm:mt-6">
      <Typography as="h2" variant="subtitle2" className="mb-0">
        {text("Average ratings")}
      </Typography>
      <dl className="mb-0 mt-3 grid max-w-lg gap-x-3 gap-y-2.5 [grid-template-columns:auto_minmax(0,1fr)_auto]">
        {rows.map(([label, value]) => (
          <AverageRatingRow key={label} label={label} value={value} />
        ))}
      </dl>
    </section>
  );
}

function CourseFilterSelect({
  courseFilterId,
  courses,
  courseId,
  selectedCourse,
  onCourseChange,
}: {
  courseFilterId: string;
  courses: LecturerDetail["lecturer"]["courses"];
  courseId: string | null;
  selectedCourse?: LecturerDetail["lecturer"]["courses"][number];
  onCourseChange: (value: string | null) => void;
}) {
  const { text, language } = useLocale("lecturers");
  return (
    <AlignSelect.Root
      variant="compact"
      value={courseId ?? "all"}
      onValueChange={(value) => onCourseChange(value === "all" ? null : value)}
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
      <AlignSelect.Content className="w-[min(20rem,var(--available-width))] max-w-[calc(100vw-1rem)]">
        <AlignSelect.Item value="all">{text("All courses")}</AlignSelect.Item>
        {courses.map((course) => (
          <AlignSelect.Item key={course.id} value={course.id}>
            <span className="min-w-0 wrap-anywhere whitespace-normal">
              {course.code} · {courseDisplayName(course, language)}
            </span>
          </AlignSelect.Item>
        ))}
      </AlignSelect.Content>
    </AlignSelect.Root>
  );
}

function ReviewsFilterToolbar({
  courseFilterId,
  courses,
  courseId,
  selectedCourse,
  reviewOrder,
  onCourseChange,
  onOrderChange,
}: {
  courseFilterId: string;
  courses: LecturerDetail["lecturer"]["courses"];
  courseId: string | null;
  selectedCourse?: LecturerDetail["lecturer"]["courses"][number];
  reviewOrder: ReviewOrder;
  onCourseChange: (value: string | null) => void;
  onOrderChange: (value: ReviewOrder) => void;
}) {
  const { text } = useLocale("lecturers");
  return (
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
        <CourseFilterSelect
          courseFilterId={courseFilterId}
          courses={courses}
          courseId={courseId}
          selectedCourse={selectedCourse}
          onCourseChange={onCourseChange}
        />
        <ReviewSortMenu kind="review" value={reviewOrder} onValueChange={onOrderChange} />
      </div>
    </div>
  );
}

function EmptyReviewsState({
  hasCourseFilter,
  onWriteReview,
  onClearFilter,
}: {
  hasCourseFilter: boolean;
  onWriteReview: () => void;
  onClearFilter: () => void;
}) {
  const { text } = useLocale("lecturers");
  return (
    <AlignEmptyState.Root align="center">
      <AlignEmptyState.Title>
        {text(hasCourseFilter ? "No reviews for this course" : "No reviews yet")}
      </AlignEmptyState.Title>
      <AlignEmptyState.Actions>
        <AlignFancyButton.Root compact className="h-9" onClick={onWriteReview}>
          <Typography as="span" variant="paragraph">
            {text("Write a review")}
          </Typography>
        </AlignFancyButton.Root>
        {hasCourseFilter && (
          <AlignButton.Root variant="neutral" mode="ghost" size="small" onClick={onClearFilter}>
            {text("Clear course filter")}
          </AlignButton.Root>
        )}
      </AlignEmptyState.Actions>
    </AlignEmptyState.Root>
  );
}

export function LecturerDetailPage({ lecturerId }: { lecturerId: string }) {
  const { data } = useSuspenseQuery(lecturerDetailQueryOptions(lecturerId));
  const { text, language } = useLocale("lecturers");
  const queryClient = useQueryClient();
  const courseFilterId = useId();
  const [browserId, setBrowserId] = useState<string | null>(null);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<ReviewOrder>("newest");
  const [courseId, setCourseId] = useState<string | null>(null);
  const selectedCourse = data.lecturer.courses.find(({ id }) => id === courseId);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<"tracked" | "untracked" | null>(
    null,
  );
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const pendingStorageKey = `lecturer-pending-reviews:${lecturerId}`;
  const pendingQuery = useQuery(ownPendingReviewsQueryOptions(lecturerId, pendingIds));
  const pendingReviews = (pendingQuery.data ?? []).filter(
    (review) => !data.reviews.some(({ id }) => id === review.id),
  );
  useEffect(() => {
    const syncPendingIds = () => {
      try {
        setPendingIds(readPendingReviewIds(pendingStorageKey));
      } catch {
        setPendingIds([]);
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === pendingStorageKey || event.key === null) syncPendingIds();
    };
    syncPendingIds();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pendingStorageKey]);
  useEffect(() => {
    if (!pendingQuery.isFetchedAfterMount || pendingQuery.isFetching || !pendingQuery.isSuccess)
      return;
    const activeIds = new Set(pendingQuery.data.map(({ id }) => id));
    const resolvedIds = pendingIds.filter((id) => !activeIds.has(id));
    if (!resolvedIds.length) return;
    void queryClient.invalidateQueries({
      queryKey: lecturerDetailQueryOptions(lecturerId).queryKey,
    });
    try {
      const ids = readPendingReviewIds(pendingStorageKey).filter((id) => !resolvedIds.includes(id));
      writePendingReviewIds(pendingStorageKey, ids);
      setPendingIds(ids);
    } catch {
      setPendingIds([]);
    }
  }, [
    lecturerId,
    pendingIds,
    pendingQuery.data,
    pendingQuery.isFetchedAfterMount,
    pendingQuery.isFetching,
    pendingQuery.isSuccess,
    pendingStorageKey,
    queryClient,
  ]);
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

  const handleToggleLike = async (reviewId: string, liked: boolean) => {
    if (!browserId) return;
    await likeMutation
      .mutateAsync({ reviewId, browserId, lecturerId, liked })
      .catch(() => undefined);
  };

  const emptyReviews = (
    <EmptyReviewsState
      hasCourseFilter={courseId !== null}
      onWriteReview={() => setReviewDialogOpen(true)}
      onClearFilter={() => setCourseId(null)}
    />
  );

  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-5 text-text-strong-950 sm:px-8 sm:py-12 lg:px-12 lg:py-8">
      <div className="mx-auto max-w-4xl">
        <LinkBack />
        <LecturerDetailHeader
          lecturer={data.lecturer}
          onWriteReview={() => setReviewDialogOpen(true)}
        />
        <ReviewedCoursesSection courses={data.lecturer.courses} />
        <AverageRatingsSection lecturer={data.lecturer} />
        <section aria-label={text("Reviews")} className="mt-4 sm:mt-6">
          <ReviewsFilterToolbar
            courseFilterId={courseFilterId}
            courses={data.lecturer.courses}
            courseId={courseId}
            selectedCourse={selectedCourse}
            reviewOrder={reviewOrder}
            onCourseChange={setCourseId}
            onOrderChange={setReviewOrder}
          />
          {likeError && (
            <Typography as="p" variant="paragraph" color="danger" role="alert" className="mb-3">
              {likeError}
            </Typography>
          )}
          <ReviewList
            reviews={reviews}
            pendingReviews={pendingReviews}
            language={language}
            emptyState={emptyReviews}
            likedReviews={likedReviews}
            canLike={browserId !== null && !likesQuery.isPending && !likesQuery.isError}
            likePending={likeMutation.isPending}
            onLike={handleToggleLike}
          />
        </section>
      </div>
      <ReviewSubmissionDialog
        initialCourse={selectedCourse}
        lecturerId={data.lecturer.id}
        lecturerName={data.lecturer.name}
        courseId={courseId ?? ""}
        browserId={browserId}
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        onSubmitted={({ reviewId, status }) => {
          setReviewDialogOpen(false);
          if (status === "published") {
            toast.custom(() => <SuccessToast message={text("Your review is published.")} />);
            return;
          }
          try {
            const ids = [...readPendingReviewIds(pendingStorageKey), reviewId];
            writePendingReviewIds(pendingStorageKey, ids);
            setPendingIds(ids);
            setPendingConfirmation("tracked");
          } catch {
            setPendingConfirmation("untracked");
          }
        }}
      />
      <AlignModal.Root
        open={pendingConfirmation !== null}
        onOpenChange={(open) => {
          if (!open) setPendingConfirmation(null);
        }}
      >
        <AlignModal.Content showClose={false}>
          <div className="flex flex-col gap-3 p-5">
            <AlignModal.Title asChild>
              <Typography as="h2" variant="subtitle2" className="m-0">
                {text("Your review is pending moderator review.")}
              </Typography>
            </AlignModal.Title>
            <AlignModal.Description asChild>
              <Typography as="p" variant="paragraph" color="muted" className="m-0">
                {text("A moderator checks reviews before they appear publicly.")}
                {pendingConfirmation === "tracked" && (
                  <>
                    {" "}
                    {text("Your review will appear here marked as pending until it is approved.")}
                  </>
                )}
              </Typography>
            </AlignModal.Description>
            <AlignModal.Close asChild>
              <AlignButton.Root className="self-end">{text("Got it")}</AlignButton.Root>
            </AlignModal.Close>
          </div>
        </AlignModal.Content>
      </AlignModal.Root>
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
