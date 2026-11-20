import { z } from "zod";

const submissionFieldsSchema = z.object({
  lecturerId: z.string().trim().min(1).max(100),
  courseId: z.string().trim().min(1).max(100),
  termLabel: z.string().trim().min(1).max(60),
  clarity: z.number().int().min(1).max(5),
  support: z.number().int().min(1).max(5),
  organization: z.number().int().min(1).max(5),
  body: z.string().trim().min(1).max(1000),
});

export const submissionFieldSchema = submissionFieldsSchema
  .extend({ anonymous: z.boolean(), authorName: z.string() })
  .keyof();

export const submissionInputSchema = z
  .discriminatedUnion("anonymous", [
    submissionFieldsSchema.extend({ anonymous: z.literal(true) }),
    submissionFieldsSchema.extend({
      anonymous: z.literal(false),
      authorName: z.string().trim().min(1).max(80),
    }),
  ])
  .transform((value) => ({
    ...value,
    authorName: value.anonymous ? "" : value.authorName,
  }));

export type ReviewSubmissionInput = z.input<typeof submissionInputSchema>;
export type ReviewSubmission = z.output<typeof submissionInputSchema>;
export type SubmissionField = z.output<typeof submissionFieldSchema>;
