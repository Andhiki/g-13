import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { useLocale } from "../../useLocale";
import { AlignFancyButton } from "../../ui/fancy-button";
import { Typography } from "../../ui/typography";
import { toast, SuccessToast } from "../../ui/toast";
import { ReviewSubmissionDialog } from "./ReviewSubmissionDialog";
import { RatingGuidePopover } from "./RatingGuidePopover";
import { ReviewList } from "./ReviewList";
import { ReviewSortMenu } from "./ReviewSortMenu";
import { RatingStars } from "./LecturerReviewCard";
import { courseDisplayName } from "./course-search";
import { orderReviews, type ReviewOrder } from "./review-order";
import { loadBrowserLikes, updateReviewLike } from "./server";

type DetailData = NonNullable<Awaited<ReturnType<typeof import("./repository").getLecturerDetail>>>;

export function LecturerDetailPage({ data }: { data: DetailData }) {
  const router = useRouter();
  const { text, language } = useLocale("lecturers");
  const [browserId, setBrowserId] = useState<string | null>(null);
  const [likedReviews, setLikedReviews] = useState<string[]>([]);
  const [likeError, setLikeError] = useState("");
  const [reviewOrder, setReviewOrder] = useState<ReviewOrder>("newest");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const reviews = orderReviews(data.reviews, reviewOrder);
  useEffect(() => {
    try {
      const key = "lecturer-review-browser-id";
      const id = localStorage.getItem(key) || crypto.randomUUID();
      localStorage.setItem(key, id);
      setBrowserId(id);
      void loadBrowserLikes({ data: { browserId: id } })
        .then(setLikedReviews)
        .catch(() => setLikeError(text("Could not update like. Please try again.")));
    } catch {
      setLikeError(text("Enable browser storage to like reviews."));
    }
  }, [text]);

  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-8 text-text-strong-950 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-4xl">
        <LinkBack />
        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Typography
              as="h1"
              variant="title"
              className="m-0 min-w-0 flex-1 text-title-h3 sm:text-title-h2"
            >
              {data.lecturer.name}
            </Typography>
            <RatingStars
              value={data.lecturer.overallAverage}
              label={text("Overall rating: {{rating}}", {
                rating:
                  data.lecturer.overallAverage === null
                    ? text("Not rated")
                    : `${data.lecturer.overallAverage.toFixed(1)}/5`,
              })}
            />
          </div>
          <Typography as="p" variant="paragraph" className="mb-0 mt-2 text-text-sub-600">
            {text(data.lecturer.reviewCount === 1 ? "{{count}} review" : "{{count}} reviews", {
              count: data.lecturer.reviewCount,
            })}
          </Typography>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <RatingGuidePopover />
            <AlignFancyButton.Root onClick={() => setReviewDialogOpen(true)}>
              {text("Write a review")}
              <RiArrowRightLine aria-hidden="true" className="size-5" />
            </AlignFancyButton.Root>
          </div>
        </header>

        <section aria-label={text("Courses reviewed")} className="mt-8">
          <Typography as="h2" variant="subtitle2" className="mb-0">
            {text("Courses reviewed")}
          </Typography>
          {data.lecturer.courses.length ? (
            <ul className="mb-0 mt-3 flex flex-wrap gap-2 pl-0">
              {data.lecturer.courses.map((course) => (
                <li
                  key={course.id}
                  className="flex min-w-0 max-w-full items-center gap-1.5 rounded-md bg-bg-weak-50 px-2.5 py-1.5"
                >
                  <Typography as="span" variant="code" className="shrink-0 text-text-sub-600">
                    {course.code}
                  </Typography>
                  <Typography as="span" variant="caption" className="truncate">
                    {courseDisplayName(course, language)}
                  </Typography>
                </li>
              ))}
            </ul>
          ) : (
            <Typography as="p" variant="paragraph" className="mb-0 mt-2 text-text-sub-600">
              {text("No reviews yet. Be the first to share your experience.")}
            </Typography>
          )}
        </section>

        <section aria-label={text("Average ratings")} className="mt-8">
          <Typography as="h2" variant="subtitle2" className="mb-0">
            {text("Average ratings")}
          </Typography>
          <dl className="mb-0 mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                ["Overall", data.lecturer.overallAverage],
                ["Clarity", data.lecturer.clarityAverage],
                ["Support", data.lecturer.supportAverage],
                ["Organization", data.lecturer.organizationAverage],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex min-w-0 items-center justify-between gap-2 rounded-10 border border-stroke-soft-200 px-3 py-2.5"
              >
                <Typography as="dt" variant="label" className="text-text-sub-600">
                  {text(label)}
                </Typography>
                <dd className="m-0 flex min-w-0 items-center gap-2">
                  <RatingStars
                    value={value}
                    label={`${text(label)}: ${value === null ? text("Not rated") : `${value.toFixed(1)}/5`}`}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-label={text("Reviews")} className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Typography as="h2" variant="subtitle2" className="mb-0">
              {text("Reviews")}
            </Typography>
            <ReviewSortMenu reviewOrder={reviewOrder} onReviewOrder={setReviewOrder} />
          </div>
          {likeError && (
            <Typography as="p" variant="paragraph" role="alert" className="mb-3 text-error-base">
              {likeError}
            </Typography>
          )}
          <ReviewList
            reviews={reviews}
            language={language}
            likedReviews={likedReviews}
            canLike={browserId !== null}
            onLike={async (reviewId, liked) => {
              if (!browserId) return;
              try {
                const result = await updateReviewLike({ data: { reviewId, browserId, liked } });
                if (!result.ok) throw new Error(result.error);
                setLikedReviews((current) =>
                  liked ? [...current, reviewId] : current.filter((id) => id !== reviewId),
                );
                setLikeError("");
                await router.invalidate({
                  filter: (match) => match.routeId === "/lecturers/$lecturerId",
                  sync: true,
                });
              } catch {
                setLikeError(text("Could not update like. Please try again."));
              }
            }}
          />
        </section>
      </div>
      <ReviewSubmissionDialog
        data={{ courses: data.courses, lecturers: [data.lecturer] }}
        draft={
          reviewDialogOpen ? { lecturerId: data.lecturer.id, courseId: null, request: 1 } : null
        }
        onClose={() => setReviewDialogOpen(false)}
        onPublished={async () => {
          setReviewDialogOpen(false);
          toast.custom(() => <SuccessToast message={text("Your review is published.")} />);
          await router.invalidate({
            filter: (match) => match.routeId === "/lecturers/$lecturerId",
            sync: true,
          });
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
      className="inline-flex min-h-10 items-center gap-2 rounded-md text-label-sm text-text-sub-600 hover:text-text-strong-950 focus-visible:outline-2 focus-visible:outline-primary-base"
    >
      <RiArrowLeftLine aria-hidden="true" className="size-4" />
      <Typography as="span" variant="label">
        {text("Back to lecturers")}
      </Typography>
    </Link>
  );
}
