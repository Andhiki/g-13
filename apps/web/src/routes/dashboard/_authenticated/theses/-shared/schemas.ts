import { z } from "zod";
import { safeHttpUrl } from "@/routes/_public/theses/-shared/thesis";

export const thesisStatusFilterSchema = z.enum(["draft", "published", "hidden", "deleted"]);
export type ThesisStatusFilter = z.infer<typeof thesisStatusFilterSchema>;

export const thesisStatusSchema = z.enum(["draft", "published", "hidden"]);
export type ThesisStatus = z.infer<typeof thesisStatusSchema>;

export const thesisTypeSchema = z.enum([
  "skripsi",
  "product-innovation",
  "collaborative-project",
  "industry-project",
  "scientific-publication",
]);
export type ThesisType = z.infer<typeof thesisTypeSchema>;

export const thesisLanguageSchema = z.enum(["id", "en"]);
export type ThesisLanguage = z.infer<typeof thesisLanguageSchema>;
export const thesisContactChannelSchema = z.enum(["email", "url"]);
export const thesisSupervisorRoleSchema = z.enum(["main", "co"]);

export const thesisPageSchema = z.object({
  offset: z.number().int().min(0),
  status: thesisStatusFilterSchema,
});

export const thesisSupervisorFieldsSchema = z.object({
  lecturerId: z.string().trim().max(100).nullable(),
  name: z.string().trim().min(1, "Enter the supervisor name.").max(200),
  role: thesisSupervisorRoleSchema.nullable(),
});
export type ThesisSupervisorFieldsInput = z.infer<typeof thesisSupervisorFieldsSchema>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const thesisBaseSchema = z.object({
  title: z.string().trim().min(1, "Enter the thesis title.").max(300),
  authorName: z.string().trim().min(1, "Enter the author name.").max(200),
  authorBatch: z.number().int().min(1945).max(2100).nullable(),
  year: z.number().int().min(1945).max(2100),
  type: thesisTypeSchema.default("skripsi"),
  fieldIds: z.array(z.string().trim().min(1).max(120)).max(20, "Use at most 20 sub-labs."),
  language: thesisLanguageSchema.default("id"),
  abstract: z.string().trim().max(50_000).nullable(),
  abstractEn: z.string().trim().max(50_000).nullable(),
  keywords: z.array(z.string().trim().min(1).max(80)).max(30, "Use at most 30 keywords."),
  repositoryUrl: z.string().trim().max(500).nullable(),
  contactChannel: thesisContactChannelSchema.nullable(),
  contactValue: z.string().trim().max(300).nullable(),
  abstractPublic: z.boolean(),
  contactPublic: z.boolean(),
  consentDate: z.iso.date().nullable(),
  consentSource: z.string().trim().max(500).nullable(),
  status: thesisStatusSchema.default("draft"),
  supervisors: z
    .array(thesisSupervisorFieldsSchema)
    .min(1, "Add at least one supervisor.")
    .max(10, "Use at most 10 supervisors."),
});

function refineThesis(value: z.infer<typeof thesisBaseSchema>, ctx: z.RefinementCtx) {
  if (value.abstractPublic && !value.abstract) {
    ctx.addIssue({
      code: "custom",
      path: ["abstract"],
      message: "Add the abstract before making it public.",
    });
  }
  if (value.contactPublic && (!value.contactChannel || !value.contactValue)) {
    ctx.addIssue({
      code: "custom",
      path: ["contactValue"],
      message: "Add an email or URL before making contact public.",
    });
  }
  if (
    (value.abstractPublic || value.contactPublic || value.status === "published") &&
    !value.consentDate
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["consentDate"],
      message: "Enter the author consent date before publishing the thesis, abstract, or contact.",
    });
  }
  if (value.consentDate && !value.consentSource) {
    ctx.addIssue({
      code: "custom",
      path: ["consentSource"],
      message: "Add the consent source, such as the GitHub issue URL.",
    });
  }
  if (value.repositoryUrl && !safeHttpUrl(value.repositoryUrl)) {
    ctx.addIssue({
      code: "custom",
      path: ["repositoryUrl"],
      message: "Enter an http(s) URL.",
    });
  }
  if (value.contactChannel && !value.contactValue) {
    ctx.addIssue({
      code: "custom",
      path: ["contactValue"],
      message: "Add the contact value.",
    });
  }
  if (value.contactValue && !value.contactChannel) {
    ctx.addIssue({
      code: "custom",
      path: ["contactChannel"],
      message: "Choose a contact channel.",
    });
  }
  if (
    value.contactChannel === "email" &&
    value.contactValue &&
    !emailPattern.test(value.contactValue)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["contactValue"],
      message: "Enter a valid email address.",
    });
  }
  if (value.contactChannel === "url" && value.contactValue && !safeHttpUrl(value.contactValue)) {
    ctx.addIssue({
      code: "custom",
      path: ["contactValue"],
      message: "Enter an http(s) URL.",
    });
  }
}

export const thesisFieldsSchema = thesisBaseSchema.superRefine(refineThesis);
export type ThesisFieldsInput = z.infer<typeof thesisFieldsSchema>;

export const createThesisSchema = thesisBaseSchema
  .extend({
    slug: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((value) => value || undefined),
  })
  .superRefine(refineThesis);
export type CreateThesisInput = z.infer<typeof createThesisSchema>;

export const updateThesisSchema = thesisBaseSchema
  .extend({ thesisId: z.string().trim().min(1).max(120) })
  .superRefine(refineThesis);
export type UpdateThesisInput = z.infer<typeof updateThesisSchema>;

export const thesisLifecycleSchema = z.object({
  thesisId: z.string().trim().min(1).max(120),
  action: z.enum(["publish", "hide", "delete", "restore"]),
});
export type ThesisLifecycleInput = z.infer<typeof thesisLifecycleSchema>;
