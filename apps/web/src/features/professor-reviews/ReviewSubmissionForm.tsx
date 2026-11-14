import { AlignFancyButton } from "../../ui/fancy-button";
import { useEffect, useRef, useState } from "react";
import { RiArrowRightLine } from "@remixicon/react";
import { AlignSelect } from "../../ui/select";
import { AlignButton } from "../../ui/button";
import { AlignModal } from "../../ui/modal";
import { useLocale } from "../../useLocale";
import { StarRatingField } from "./StarRatingField";
import { ReviewCourseField } from "./ReviewCourseField";
import { getSubmissionErrors, type SubmissionErrors } from "./submission-validation";
import { publishProfessorReview } from "./server";

type Data = Awaited<ReturnType<typeof import("./repository").getPublicProfessorReviews>>;
export type ReviewDraft = { professorId: string; courseId: string | null; request: number };
const control =
  "mt-2 block min-h-11 w-full rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-primary-base sm:text-paragraph-sm";
const metrics = [
  { name: "clarity", label: "Clarity", hint: "How easy were the explanations to understand?" },
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
] as const;
export function ReviewSubmissionForm({
  data,
  initialProfessorId,
  initialCourseId,
  onClose,
  onPublished,
}: {
  data: Data;
  initialProfessorId: string;
  initialCourseId: string;
  onClose: () => void;
  onPublished: (reviewId: string) => Promise<void>;
}) {
  const { text } = useLocale("professors");
  const form = useRef<HTMLFormElement>(null);
  const [professorId, setProfessorId] = useState(initialProfessorId);
  const [courseId, setCourseId] = useState(initialCourseId);
  const [anonymous, setAnonymous] = useState(true);
  const [body, setBody] = useState("");
  const [ratings, setRatings] = useState({ clarity: 0, support: 0, organization: 0 });
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<SubmissionErrors>({});
  const [message, setMessage] = useState("");
  useEffect(() => {
    requestAnimationFrame(() => {
      form.current
        ?.querySelector<HTMLElement>(
          initialProfessorId ? 'input[role="combobox"]' : "#review-professor",
        )
        ?.focus({ preventScroll: true });
    });
  }, [initialProfessorId]);
  const clearError = (name: keyof SubmissionErrors) =>
    setErrors((current) => ({ ...current, [name]: undefined }));
  const errorProps = (name: keyof SubmissionErrors) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `review-${name}-error` : undefined,
  });
  const fieldError = (name: keyof SubmissionErrors) =>
    errors[name] && (
      <p id={`review-${name}-error`} className="mb-0 mt-1.5 text-paragraph-xs text-error-base">
        {text(errors[name])}
      </p>
    );
  return (
    <form
      ref={form}
      noValidate
      className="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        const values = new FormData(event.currentTarget);
        const input = {
          professorId,
          courseId,
          termLabel: values.get("termLabel"),
          anonymous,
          authorName: values.get("authorName") ?? "",
          body,
          ...ratings,
        };
        const issues = getSubmissionErrors(input);
        setErrors(issues);
        setMessage("");
        if (Object.keys(issues).length) {
          requestAnimationFrame(() =>
            form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
          );
          return;
        }
        setPending(true);
        try {
          const result = await publishProfessorReview({ data: input });
          if (!result.ok) {
            setMessage(
              result.error === "rate-limit"
                ? "Submission limit reached. Try again next hour."
                : result.error === "invalid"
                  ? "The professor or course may no longer be available. Choose them again and retry."
                  : "Reviews are temporarily unavailable. Please try again later.",
            );
            return;
          }
          await onPublished(result.reviewId);
        } catch {
          setMessage("Could not confirm publication. Refresh the page before trying again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <header className="shrink-0 border-b border-stroke-soft-200 p-5 pr-14">
        <AlignModal.Title asChild>
          <h2 className="m-0 font-display text-label-lg text-text-strong-950">
            {text("Write a review")}
          </h2>
        </AlignModal.Title>
        <AlignModal.Description asChild>
          <p className="mb-0 mt-1 text-paragraph-sm text-text-sub-600">
            {text("Share an experience to help other students choose their classes.")}
          </p>
        </AlignModal.Description>
      </header>

      <div className="min-h-0 overflow-y-auto px-5 pt-5 pb-3">
        <fieldset disabled={pending} className="min-w-0 space-y-6 disabled:opacity-70">
          <div className="space-y-4">
            <div>
              <label htmlFor="review-professor" className="text-label-sm">
                {text("Professor")}
              </label>
              <AlignSelect.Root
                name="professorId"
                value={professorId}
                onValueChange={(value) => {
                  setProfessorId(value);
                  clearError("professorId");
                }}
              >
                <AlignSelect.Trigger
                  id="review-professor"
                  className="mt-2 min-h-11"
                  {...errorProps("professorId")}
                >
                  <AlignSelect.Value placeholder={text("Select a professor")} />
                </AlignSelect.Trigger>
                <AlignSelect.Content>
                  {data.professors.map((p) => (
                    <AlignSelect.Item key={p.id} value={p.id}>
                      {p.name}
                    </AlignSelect.Item>
                  ))}
                </AlignSelect.Content>
              </AlignSelect.Root>
              {fieldError("professorId")}
            </div>
            <ReviewCourseField
              courses={data.courses}
              value={courseId}
              onChange={(value) => {
                setCourseId(value);
                clearError("courseId");
              }}
              error={errors.courseId ? text(errors.courseId) : undefined}
            />
            <div>
              <label htmlFor="review-term" className="text-label-sm">
                {text("Term")}
              </label>
              <input
                id="review-term"
                className={control}
                name="termLabel"
                maxLength={60}
                placeholder={text("e.g. 2026/2027 Ganjil")}
                {...errorProps("termLabel")}
                onChange={() => clearError("termLabel")}
              />
              <p className="mb-0 mt-1.5 text-paragraph-xs text-text-sub-600">
                {text("When did you take this class? 1–60 characters.")}
              </p>
              {fieldError("termLabel")}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="m-0 text-label-md">{text("Rate your experience")}</h3>
              <p className="mb-0 mt-1 text-paragraph-xs text-text-sub-600">
                {text("Choose a score for each: 1 (lowest) to 5 (highest).")}
              </p>
            </div>
            <div className="space-y-5 border-l border-stroke-soft-200 pl-4">
              {metrics.map((metric) => (
                <StarRatingField
                  key={metric.name}
                  name={metric.name}
                  label={text(metric.label)}
                  hint={text(metric.hint)}
                  value={ratings[metric.name]}
                  onChange={(value) => {
                    setRatings((current) => ({ ...current, [metric.name]: value }));
                    clearError(metric.name);
                  }}
                  error={errors[metric.name] ? text(errors[metric.name] ?? "") : undefined}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="review-body" className="text-label-sm">
              {text("Your experience")}
            </label>
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
            <div className="mt-1.5 flex justify-between gap-3 text-paragraph-xs text-text-sub-600">
              <span>{text("1–1,000 characters. Avoid personal information.")}</span>
              <span className="shrink-0 tabular-nums">{body.length}/1,000</span>
            </div>
            {fieldError("body")}
          </div>

          <div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-label-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary-base"
                checked={anonymous}
                onChange={(event) => setAnonymous(event.target.checked)}
              />
              {text("Publish as Anonymous")}
            </label>
            {!anonymous && (
              <div className="mt-3">
                <label htmlFor="review-author" className="text-label-sm">
                  {text("Display name")}
                </label>
                <input
                  id="review-author"
                  className={control}
                  name="authorName"
                  maxLength={80}
                  {...errorProps("authorName")}
                  onChange={() => clearError("authorName")}
                />
                <p className="mb-0 mt-1.5 text-paragraph-xs text-text-sub-600">
                  {text("1–80 characters. Avoid personal information.")}
                </p>
                {fieldError("authorName")}
              </div>
            )}
          </div>
        </fieldset>
      </div>

      <footer className="shrink-0 border-t border-stroke-soft-200 p-5">
        {message && (
          <div role="status" aria-live="polite" className="mb-3 text-paragraph-sm text-error-base">
            <p className="m-0">{text(message)}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <AlignButton.Root
            type="button"
            mode="stroke"
            variant="neutral"
            className="min-h-11"
            onClick={onClose}
          >
            {text("Cancel")}
          </AlignButton.Root>
          <AlignFancyButton.Root
            type="submit"
            disabled={pending || !data.professors.length || !data.courses.length}
            className="min-h-11 w-full"
          >
            <span className="text-paragraph-xs sm:text-label-sm">
              {text(pending ? "Publishing…" : "Publish review")}
            </span>
            <RiArrowRightLine aria-hidden="true" className="hidden size-5 sm:block" />
          </AlignFancyButton.Root>
        </div>
      </footer>
    </form>
  );
}
