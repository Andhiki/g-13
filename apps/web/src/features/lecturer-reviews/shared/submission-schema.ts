import { z } from "zod";

export type ReviewSubmission = {
  lecturerId: string;
  courseId: string;
  termLabel: string;
  anonymous: boolean;
  authorName: string;
  clarity: number;
  support: number;
  organization: number;
  body: string;
};

export const submissionInputSchema = z
  .object({
    lecturerId: z.string().trim().min(1).max(100),
    courseId: z.string().trim().min(1).max(100),
    termLabel: z.string().trim().min(1).max(60),
    anonymous: z.boolean(),
    // Anonymous submissions ignore this field entirely. The refinement below
    // validates it only for named submissions.
    authorName: z.unknown().optional(),
    clarity: z.number().int().min(1).max(5),
    support: z.number().int().min(1).max(5),
    organization: z.number().int().min(1).max(5),
    body: z.string().trim().min(1).max(1000),
  })
  .superRefine((value, context) => {
    if (!value.anonymous) {
      const name = typeof value.authorName === "string" ? value.authorName.trim() : "";
      if (!name || name.length > 80) {
        context.addIssue({ code: "custom", path: ["authorName"], message: "Invalid name." });
      }
    }
  })
  .transform((value): ReviewSubmission => ({
    ...value,
    authorName: typeof value.authorName === "string" ? value.authorName.trim() : "",
  }));
