import { submissionInputSchema, type ReviewSubmission } from "./submission-schema";

export type SubmissionErrors = Partial<Record<keyof ReviewSubmission, string>>;

export function getSubmissionErrors(value: unknown): SubmissionErrors {
  const errors: SubmissionErrors = {};
  const result = submissionInputSchema.safeParse(value);
  if (result.success) return errors;

  const messages: Record<keyof ReviewSubmission, string> = {
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
    const field = issue.path[0];
    if (typeof field === "string" && field in messages) {
      const key = field as keyof ReviewSubmission;
      errors[key] = messages[key];
    }
  }
  return errors;
}
