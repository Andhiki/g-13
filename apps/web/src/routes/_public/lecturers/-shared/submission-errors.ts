import {
  submissionFieldSchema,
  submissionInputSchema,
  type ReviewSubmissionInput,
  type SubmissionField,
} from "./submission-schema";

export type SubmissionErrors = Partial<Record<SubmissionField, string>>;

export function getSubmissionErrors(value: ReviewSubmissionInput): SubmissionErrors {
  const errors: SubmissionErrors = {};
  const result = submissionInputSchema.safeParse(value);
  if (result.success) return errors;

  const messages: Record<SubmissionField, string> = {
    lecturerId: "Select a lecturer.",
    courseId: "Select a course from the results.",
    termLabel: "Enter a term using 1–60 characters.",
    anonymous: "Choose how your name is displayed.",
    authorName: "Enter a display name using 1–80 characters.",
    clarity: "Choose a rating from 1 to 5.",
    support: "Choose a rating from 1 to 5.",
    organization: "Choose a rating from 1 to 5.",
    body: "Describe your experience using 1–1,000 characters.",
  };
  for (const issue of result.error.issues) {
    const field = submissionFieldSchema.safeParse(issue.path[0]);
    if (field.success) errors[field.data] = messages[field.data];
  }
  return errors;
}
