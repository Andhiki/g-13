import { Typography } from "@/ui/typography";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewTerms } from "../-client/review-terms";
import { AlignModal } from "@/ui/modal";
import { useLocale } from "@/useLocale";
import type { ReviewCourseOption } from "../-shared/course-search";
import { TurnstileField, type TurnstileFieldHandle } from "./TurnstileField";
import { REVIEW_ERRORS } from "../-shared/errors";
import type { ReviewSubmissionInput } from "../-shared/submission-schema";
import { getSubmissionErrors, type SubmissionErrors } from "../-shared/submission-errors";
import { publishLecturerReviewMutationOptions } from "../-client/mutations";
import { turnstileSiteKeyQueryOptions } from "../-client/queries";
import { initialRatings, ReviewFormFooter, ReviewFormFields } from "./ReviewFormFields";

const SUBMISSION_ERROR_MESSAGES: Record<string, string> = {
  [REVIEW_ERRORS.RATE_LIMIT]: "Submission limit reached. Try again next hour.",
  [REVIEW_ERRORS.CAPTCHA]: "Security verification failed. Please try again.",
  [REVIEW_ERRORS.INVALID]:
    "The lecturer or course may no longer be available. Refresh the page and try again.",
  [REVIEW_ERRORS.UNAVAILABLE]: "Reviews are temporarily unavailable. Please try again later.",
};

function submissionErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : null;
  return (
    (code && SUBMISSION_ERROR_MESSAGES[code]) ||
    "Could not confirm submission. Refresh the page before trying again."
  );
}

export function ReviewSubmissionForm({
  initialCourse,
  lecturerId,
  lecturerName,
  initialCourseId,
  onClose,
  onSubmitted,
}: {
  initialCourse?: ReviewCourseOption;
  lecturerId: string;
  lecturerName: string;
  initialCourseId: string;
  onClose: () => void;
  onSubmitted: (status: "pending" | "published") => Promise<void>;
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
  const isSubmitting = submitting || publishMutation.isPending;
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      await onSubmitted(result.status);
    } catch (error: unknown) {
      setMessage(submissionErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <form
      ref={form}
      noValidate
      className="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col"
      onSubmit={handleSubmit}
    >
      <header className="shrink-0 border-b border-stroke-soft-200 p-4 pr-12">
        <AlignModal.Title asChild>
          <Typography
            as="h2"
            tabIndex={-1}
            variant="subtitle1"
            color="strong"
            className={
              // oxlint-disable-next-line shadcn/no-restyle -- programmatic focus target; keyboard focus is shown by the form's fields
              "m-0 outline-none"
            }
          >
            {text("Write a review for {{lecturerName}}", { lecturerName })}
          </Typography>
        </AlignModal.Title>
      </header>
      <ReviewFormFields
        initialCourse={initialCourse}
        anonymous={anonymous}
        authorName={authorName}
        courseId={courseId}
        termLabel={termLabel}
        terms={terms}
        ratings={ratings}
        body={body}
        errors={errors}
        isSubmitting={isSubmitting}
        setAnonymous={setAnonymous}
        setAuthorName={setAuthorName}
        setCourseId={setCourseId}
        setTermLabel={setTermLabel}
        setRatings={setRatings}
        setBody={setBody}
        clearError={clearError}
      />
      <TurnstileField ref={turnstileRef} siteKey={siteKey} />
      <ReviewFormFooter message={message} isSubmitting={isSubmitting} onClose={onClose} />
    </form>
  );
}
