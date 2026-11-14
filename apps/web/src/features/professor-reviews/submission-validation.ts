export type ReviewSubmission = {
  professorId: string;
  courseId: string;
  termLabel: string;
  anonymous: boolean;
  authorName: string;
  clarity: number;
  support: number;
  organization: number;
  body: string;
};
export type SubmissionErrors = Partial<Record<keyof ReviewSubmission, string>>;
export function getSubmissionErrors(value: unknown): SubmissionErrors {
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const errors: SubmissionErrors = {};
  const fields = [
    ["professorId", 100, "Select a professor."],
    ["courseId", 100, "Select a course from the results."],
    ["termLabel", 60, "Enter a term using 1–60 characters."],
    ["body", 1000, "Describe your experience using 1–1,000 characters."],
    ...(v.anonymous !== true
      ? [["authorName", 80, "Enter a display name using 1–80 characters."]]
      : []),
  ] as [keyof ReviewSubmission, number, string][];
  for (const [key, max, message] of fields) {
    const field = v[key];
    if (typeof field !== "string" || !field.trim() || field.trim().length > max)
      errors[key] = message;
  }
  if (typeof v.anonymous !== "boolean") errors.anonymous = "Choose how your name is displayed.";
  for (const key of ["clarity", "support", "organization"] as const) {
    const rating = v[key];
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5)
      errors[key] = "Choose a rating from 1 to 5.";
  }
  return errors;
}
export function validateSubmission(value: unknown): ReviewSubmission {
  if (Object.keys(getSubmissionErrors(value)).length) throw new Error("invalid");
  const v = value as ReviewSubmission;
  return {
    professorId: v.professorId.trim(),
    courseId: v.courseId.trim(),
    termLabel: v.termLabel.trim(),
    anonymous: v.anonymous,
    authorName: v.anonymous ? "Anonymous" : v.authorName.trim(),
    clarity: v.clarity,
    support: v.support,
    organization: v.organization,
    body: v.body.trim(),
  };
}
