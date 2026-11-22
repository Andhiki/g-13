import { z } from "zod";

const trimmed = z.string().trim();
const requiredTrimmed = (max: number) => trimmed.min(1).max(max);
const integerRating = z.number().int();
const ratingScore = () => integerRating.min(1).max(5);

const submissionFieldsSchema = z.object({
  lecturerId: requiredTrimmed(100),
  courseId: requiredTrimmed(100),
  termLabel: requiredTrimmed(60),
  clarity: ratingScore(),
  support: ratingScore(),
  organization: ratingScore(),
  body: requiredTrimmed(1000),
});

export const submissionFieldSchema = submissionFieldsSchema
  .extend({ anonymous: z.boolean(), authorName: z.string() })
  .keyof();

export const submissionInputSchema = z
  .discriminatedUnion("anonymous", [
    submissionFieldsSchema.extend({ anonymous: z.literal(true) }),
    submissionFieldsSchema.extend({
      anonymous: z.literal(false),
      authorName: requiredTrimmed(80),
    }),
  ])
  .transform((value) => ({
    ...value,
    authorName: value.anonymous ? "" : value.authorName,
  }));

export type ReviewSubmissionInput = z.input<typeof submissionInputSchema>;
export type ReviewSubmission = z.output<typeof submissionInputSchema>;
export type SubmissionField = z.output<typeof submissionFieldSchema>;
