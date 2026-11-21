import { Typography } from "@/ui/typography";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RiArrowRightLine, RiSpyLine, RiUserLine } from "@remixicon/react";
import { AlignSelect } from "@/ui/select";
import * as AlignSwitch from "@/ui/switch";
import { AlignFancyButton } from "@/ui/fancy-button";
import { reviewTerms } from "../-client/review-terms";
import { AlignButton } from "@/ui/button";
import { AlignModal } from "@/ui/modal";
import { useLocale } from "@/useLocale";
import { StarRatingField } from "./StarRatingField";
import { ReviewCourseField } from "./ReviewCourseField";
import type { ReviewCourseOption } from "../-shared/course-search";
import { TurnstileField, type TurnstileFieldHandle } from "./TurnstileField";
import { REVIEW_ERRORS } from "../-shared/errors";
import type { ReviewSubmissionInput } from "../-shared/submission-schema";
import { getSubmissionErrors, type SubmissionErrors } from "../-shared/submission-errors";
import { publishLecturerReviewMutationOptions } from "../-client/mutations";
import { turnstileSiteKeyQueryOptions } from "../-client/queries";

const row = "grid min-w-0 gap-2 sm:grid-cols-[240px_minmax(0,1fr)] sm:gap-6";
const control =
  "block min-h-9 w-full rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 py-1.5 text-base focus-visible:outline-2 focus-visible:outline-primary-base sm:text-paragraph-sm";
const initialRatings = { clarity: 0, support: 0, organization: 0 };
const metrics = [
  {
    name: "clarity",
    label: "Clarity",
    hint: "How easy were the explanations to understand?",
  },
  {
    name: "support",
    label: "Support",
    hint: "How helpful was the lecturer when you needed support?",
  },
  {
    name: "organization",
    label: "Organization",
    hint: "How well were the course materials and activities structured?",
  },
] satisfies { name: keyof typeof initialRatings; label: string; hint: string }[];
export function ReviewSubmissionForm({
  initialCourse,
  lecturerId,
  lecturerName,
  initialCourseId,
  onClose,
  onPublished,
}: {
  initialCourse?: ReviewCourseOption;
  lecturerId: string;
  lecturerName: string;
  initialCourseId: string;
  onClose: () => void;
  onPublished: (reviewId: string) => Promise<void>;
}) {
  const { text } = useLocale("lecturers");
  const queryClient = useQueryClient();
  const publishMutation = useMutation(publishLecturerReviewMutationOptions(queryClient));
  const siteKeyQuery = useQuery(turnstileSiteKeyQueryOptions());
  const siteKey = siteKeyQuery.data?.siteKey ?? "";
  const turnstileRef = useRef<TurnstileFieldHandle>(null);
  const form = useRef<HTMLFormElement>(null);
  const [courseId, setCourseId] = useState(initialCourseId);
  const [anonymous, setAnonymous] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [termLabel, setTermLabel] = useState("");
  const [terms, setTerms] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [ratings, setRatings] = useState(initialRatings);
  const [errors, setErrors] = useState<SubmissionErrors>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    setTerms(reviewTerms(new Date()));
    requestAnimationFrame(() => {
      form.current?.querySelector<HTMLElement>("#review-anonymous")?.focus({ preventScroll: true });
    });
  }, []);
  const clearError = (name: keyof SubmissionErrors) =>
    setErrors((current) => ({ ...current, [name]: undefined }));
  const errorProps = (name: keyof SubmissionErrors) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `review-${name}-error` : undefined,
  });
  const fieldError = (name: keyof SubmissionErrors) =>
    errors[name] && (
      <Typography
        as="p"
        variant="caption"
        color="danger"
        id={`review-${name}-error`}
        className="mb-0 mt-1.5"
      >
        {text(errors[name])}
      </Typography>
    );
  const AuthorIcon = anonymous ? RiSpyLine : RiUserLine;
  const isSubmitting = submitting || publishMutation.isPending;
  return (
    <form
      ref={form}
      noValidate
      className="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col"
      onSubmit={async (event) => {
        event.preventDefault();
        if (isSubmitting) return;
        const submission = { lecturerId, courseId, termLabel, body, ...ratings };
        const input: ReviewSubmissionInput = anonymous
          ? { ...submission, anonymous: true }
          : { ...submission, anonymous: false, authorName };
        const issues = getSubmissionErrors(input);
        setErrors(issues);
        setMessage("");
        if (Object.keys(issues).length) {
          requestAnimationFrame(() =>
            form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
          );
          return;
        }
        setSubmitting(true);
        try {
          const turnstileToken = siteKey ? await turnstileRef.current?.execute() : "";
          if (!turnstileToken) {
            setMessage("Complete the security check and try again.");
            return;
          }
          const result = await publishMutation.mutateAsync({ ...input, turnstileToken });
          await onPublished(result.reviewId);
        } catch (error: unknown) {
          const code = error instanceof Error ? error.message : null;
          setMessage(
            code === REVIEW_ERRORS.RATE_LIMIT
              ? "Submission limit reached. Try again next hour."
              : code === REVIEW_ERRORS.CAPTCHA
                ? "Security verification failed. Please try again."
                : code === REVIEW_ERRORS.INVALID
                  ? "The lecturer or course may no longer be available. Refresh the page and try again."
                  : code === REVIEW_ERRORS.UNAVAILABLE
                    ? "Reviews are temporarily unavailable. Please try again later."
                    : "Could not confirm publication. Refresh the page before trying again.",
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <header className="shrink-0 border-b border-stroke-soft-200 p-4 pr-12">
        <AlignModal.Title asChild>
          <Typography
            as="h2"
            tabIndex={-1}
            variant="subtitle1"
            color="strong"
            className="m-0 outline-none"
          >
            {text("Write a review for {{lecturerName}}", { lecturerName })}
          </Typography>
        </AlignModal.Title>
      </header>

      <div className="min-h-0 overflow-y-auto px-4 pt-4 pb-3 sm:mb-3">
        <fieldset disabled={isSubmitting} className="min-w-0 space-y-4 disabled:opacity-70">
          <div className={row}>
            <div>
              <Typography as="label" variant="label" htmlFor="review-author">
                {text("Display name")}
              </Typography>
              <label
                htmlFor="review-anonymous"
                className="mt-2 flex min-h-9 cursor-pointer items-center gap-3 text-paragraph-sm sm:mt-1"
              >
                <AlignSwitch.Root
                  id="review-anonymous"
                  checked={anonymous}
                  onCheckedChange={(checked) => {
                    setAnonymous(checked);
                    clearError("authorName");
                  }}
                />
                {text("Publish as Anonymous")}
              </label>
            </div>
            <div className="sm:pt-9">
              <div
                className={`flex min-h-9 items-center gap-2 rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 focus-within:outline-2 focus-within:outline-primary-base ${anonymous ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <AuthorIcon aria-hidden="true" className="size-5 shrink-0 text-text-sub-600" />
                <input
                  id="review-author"
                  className="min-h-9 min-w-0 w-full bg-transparent py-1.5 text-base outline-none disabled:cursor-not-allowed sm:text-paragraph-sm"
                  name="authorName"
                  maxLength={80}
                  value={anonymous ? text("Anonymous") : authorName}
                  disabled={anonymous}
                  required={!anonymous}
                  {...errorProps("authorName")}
                  onChange={(event) => {
                    setAuthorName(event.target.value);
                    clearError("authorName");
                  }}
                />
              </div>
              {fieldError("authorName")}
            </div>
          </div>
          <ReviewCourseField
            initialCourse={initialCourse}
            value={courseId}
            onChange={(value) => {
              setCourseId(value);
              clearError("courseId");
            }}
            error={errors.courseId ? text(errors.courseId) : undefined}
          />
          <div className={row}>
            <div>
              <Typography as="label" variant="label" htmlFor="review-term">
                {text("Term")}
              </Typography>
            </div>
            <div>
              <AlignSelect.Root
                variant="compact"
                name="termLabel"
                value={termLabel}
                onValueChange={(value) => {
                  setTermLabel(value);
                  clearError("termLabel");
                }}
              >
                <AlignSelect.Trigger
                  id="review-term"
                  className="h-9 min-h-9 w-full"
                  {...errorProps("termLabel")}
                >
                  <AlignSelect.Value placeholder={text("Select a term")} />
                </AlignSelect.Trigger>
                <AlignSelect.Content className="w-[var(--radix-select-trigger-width)]">
                  {terms.map((term, index) => (
                    <AlignSelect.Item key={term} value={term}>
                      {index === 0 ? text("{{term}} (Current)", { term }) : term}
                    </AlignSelect.Item>
                  ))}
                </AlignSelect.Content>
              </AlignSelect.Root>
              {fieldError("termLabel")}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {metrics.map((metric) => (
              <StarRatingField
                key={metric.name}
                name={metric.name}
                label={text(metric.label)}
                hint={text(metric.hint)}
                value={ratings[metric.name]}
                onChange={(value) => {
                  setRatings((current) => ({
                    ...current,
                    [metric.name]: value,
                  }));
                  clearError(metric.name);
                }}
                error={errors[metric.name] ? text(errors[metric.name] ?? "") : undefined}
              />
            ))}
          </div>

          <div className={row}>
            <div>
              <Typography as="label" variant="label" htmlFor="review-body">
                {text("Your experience")}
              </Typography>
            </div>
            <div>
              <textarea
                id="review-body"
                className={control}
                name="body"
                maxLength={1000}
                rows={4}
                placeholder={text("What helped you learn? What could be improved?")}
                value={body}
                {...errorProps("body")}
                onChange={(event) => {
                  setBody(event.target.value);
                  clearError("body");
                }}
              />
              <div className="mt-1.5 text-text-sub-600">
                <Typography as="span" variant="caption" className="shrink-0 tabular-nums">
                  {body.length}/1,000
                </Typography>
              </div>
              {fieldError("body")}
            </div>
          </div>
        </fieldset>
      </div>

      <TurnstileField ref={turnstileRef} siteKey={siteKey} />

      <footer className="shrink-0 border-t border-stroke-soft-200 p-4">
        {message && (
          <div role="status" aria-live="polite" className="mb-3 text-paragraph-sm text-error-base">
            <Typography as="p" variant="paragraph" className="m-0">
              {text(message)}
            </Typography>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
          <AlignButton.Root
            type="button"
            mode="stroke"
            variant="neutral"
            size="small"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {text("Cancel")}
          </AlignButton.Root>
          <AlignFancyButton.Root
            type="submit"
            size="small"
            isLoading={isSubmitting}
            icon={<RiArrowRightLine className="size-5" />}
            iconPosition="end"
            disabled={isSubmitting}
            className="w-full text-paragraph-sm sm:w-auto"
          >
            <Typography as="span" variant="paragraph">
              {text("Publish review")}
            </Typography>
          </AlignFancyButton.Root>
        </div>
      </footer>
    </form>
  );
}
