import { Typography } from "@/ui/typography";
import {
  RiArrowDownSLine,
  RiArrowRightLine,
  RiCheckLine,
  RiSpyLine,
  RiUserLine,
} from "@remixicon/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react/select";
import * as AlignSwitch from "@/ui/switch";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignButton } from "@/ui/button";
import { useLocale } from "@/useLocale";
import { StarRatingField } from "./StarRatingField";
import { ReviewCourseField } from "./ReviewCourseField";
import type { ReviewCourseOption } from "../-shared/course-search";
import type { SubmissionErrors } from "../-shared/submission-errors";

const row = "grid min-w-0 gap-2 sm:grid-cols-[240px_minmax(0,1fr)] sm:gap-6";
const control =
  "block min-h-9 w-full rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 py-1.5 text-base focus-visible:outline-2 focus-visible:outline-primary-base sm:text-paragraph-sm";
export const initialRatings = { clarity: 0, support: 0, organization: 0 };
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

function FieldError({ name, error }: { name: keyof SubmissionErrors; error?: string }) {
  const { text } = useLocale("lecturers");
  if (!error) return null;
  return (
    <Typography
      as="p"
      variant="caption"
      color="danger"
      id={`review-${name}-error`}
      className="mb-0 mt-1.5"
    >
      {text(error)}
    </Typography>
  );
}

function AuthorNameInputBox({
  anonymous,
  authorName,
  error,
  onAuthorNameChange,
}: {
  anonymous: boolean;
  authorName: string;
  error?: string;
  onAuthorNameChange: (value: string) => void;
}) {
  const { text } = useLocale("lecturers");
  const AuthorIcon = anonymous ? RiSpyLine : RiUserLine;
  return (
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
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "review-authorName-error" : undefined}
          onChange={(event) => onAuthorNameChange(event.target.value)}
        />
      </div>
      <FieldError name="authorName" error={error} />
    </div>
  );
}

function AuthorNameField({
  anonymous,
  authorName,
  error,
  onAnonymousChange,
  onAuthorNameChange,
}: {
  anonymous: boolean;
  authorName: string;
  error?: string;
  onAnonymousChange: (checked: boolean) => void;
  onAuthorNameChange: (value: string) => void;
}) {
  const { text } = useLocale("lecturers");
  return (
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
            onCheckedChange={onAnonymousChange}
          />
          {text("Publish as Anonymous")}
        </label>
      </div>
      <AuthorNameInputBox
        anonymous={anonymous}
        authorName={authorName}
        error={error}
        onAuthorNameChange={onAuthorNameChange}
      />
    </div>
  );
}

function TermSelectField({
  termLabel,
  terms,
  error,
  onChange,
}: {
  termLabel: string;
  terms: string[];
  error?: string;
  onChange: (value: string) => void;
}) {
  const { text } = useLocale("lecturers");
  const termOptions = terms.map((term, index) => ({
    value: term,
    label: index === 0 ? text("{{term}} (Current)", { term }) : term,
  }));
  return (
    <div className={row}>
      <div>
        <Typography as="label" variant="label" htmlFor="review-term">
          {text("Term")}
        </Typography>
      </div>
      <div>
        <Select
          items={termOptions}
          name="termLabel"
          value={termLabel || null}
          onValueChange={(value) => onChange(value ?? "")}
          placeholder={text("Select a term")}
        >
          <SelectTrigger
            id="review-term"
            className="group/trigger flex h-9 min-h-9 w-full min-w-0 items-center justify-between gap-2 rounded-10 bg-bg-white-0 pl-3 pr-2.5 text-left text-paragraph-sm text-text-strong-950 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 outline-none transition duration-200 ease-out hover:bg-bg-weak-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-base data-placeholder:text-text-sub-600 disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 disabled:shadow-none disabled:ring-transparent"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "review-termLabel-error" : undefined}
          >
            <SelectValue className="min-w-0 truncate" />
            <RiArrowDownSLine
              aria-hidden="true"
              className="size-5 shrink-0 text-text-sub-600 transition duration-200 ease-out group-data-open/trigger:rotate-180"
            />
          </SelectTrigger>
          <SelectContent
            sideOffset={8}
            className="z-50 max-h-[min(196px,var(--available-height))] w-[var(--anchor-width)] overflow-y-auto rounded-2xl bg-bg-white-0 p-2 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200 transition duration-150 ease-out data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0"
          >
            {termOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="group relative flex min-h-9 cursor-[var(--interactive-cursor)] select-none items-center gap-2 rounded-lg p-2 pr-9 text-paragraph-sm text-text-strong-950 outline-none data-highlighted:bg-bg-weak-50 data-disabled:pointer-events-none data-disabled:text-text-disabled-300"
              >
                {option.label}
                <SelectItemIndicator className="absolute right-2 top-1/2 -translate-y-1/2 text-text-sub-600">
                  <RiCheckLine aria-hidden="true" className="size-5" />
                </SelectItemIndicator>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError name="termLabel" error={error} />
      </div>
    </div>
  );
}

function ReviewBodyField({
  body,
  error,
  onChange,
}: {
  body: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const { text } = useLocale("lecturers");
  return (
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
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "review-body-error" : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="mt-1.5 text-text-sub-600">
          <Typography as="span" variant="caption" className="shrink-0 tabular-nums">
            {body.length}/1,000
          </Typography>
        </div>
        <FieldError name="body" error={error} />
      </div>
    </div>
  );
}

export function ReviewFormFooter({
  message,
  isSubmitting,
  onClose,
}: {
  message: string;
  isSubmitting: boolean;
  onClose: () => void;
}) {
  const { text } = useLocale("lecturers");
  return (
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
          className="w-full sm:w-auto"
        >
          <Typography as="span" variant="paragraph">
            {text("Submit review")}
          </Typography>
        </AlignFancyButton.Root>
      </div>
    </footer>
  );
}

export function ReviewFormFields({
  initialCourse,
  anonymous,
  authorName,
  courseId,
  termLabel,
  terms,
  ratings,
  body,
  errors,
  isSubmitting,
  setAnonymous,
  setAuthorName,
  setCourseId,
  setTermLabel,
  setRatings,
  setBody,
  clearError,
}: {
  initialCourse?: ReviewCourseOption;
  anonymous: boolean;
  authorName: string;
  courseId: string;
  termLabel: string;
  terms: string[];
  ratings: typeof initialRatings;
  body: string;
  errors: SubmissionErrors;
  isSubmitting: boolean;
  setAnonymous: (value: boolean) => void;
  setAuthorName: (value: string) => void;
  setCourseId: (value: string) => void;
  setTermLabel: (value: string) => void;
  setRatings: React.Dispatch<React.SetStateAction<typeof initialRatings>>;
  setBody: (value: string) => void;
  clearError: (name: keyof SubmissionErrors) => void;
}) {
  const { text } = useLocale("lecturers");
  const handleBodyChange = (value: string) => {
    setBody(value);
    clearError("body");
  };

  return (
    <div className="min-h-0 overflow-y-auto px-4 pt-4 pb-3 sm:mb-3">
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-4 disabled:opacity-70">
        <AuthorNameField
          anonymous={anonymous}
          authorName={authorName}
          error={errors.authorName}
          onAnonymousChange={(checked) => {
            setAnonymous(checked);
            clearError("authorName");
          }}
          onAuthorNameChange={(value) => {
            setAuthorName(value);
            clearError("authorName");
          }}
        />
        <ReviewCourseField
          initialCourse={initialCourse}
          value={courseId}
          onChange={(value) => {
            setCourseId(value);
            clearError("courseId");
          }}
          error={errors.courseId ? text(errors.courseId) : undefined}
        />
        <TermSelectField
          termLabel={termLabel}
          terms={terms}
          error={errors.termLabel}
          onChange={(value) => {
            setTermLabel(value);
            clearError("termLabel");
          }}
        />
        <div className="space-y-3 pt-2">
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
        <ReviewBodyField body={body} error={errors.body} onChange={handleBodyChange} />
      </fieldset>
    </div>
  );
}
