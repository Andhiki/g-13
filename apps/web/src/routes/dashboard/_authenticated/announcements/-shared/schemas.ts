import { z } from "zod";

export const announcementStatusSchema = z.enum(["live", "scheduled", "expired", "disabled"]);
export type AnnouncementStatus = z.infer<typeof announcementStatusSchema>;

export const announcementPageSchema = z.object({
  offset: z.number().int().min(0),
  status: announcementStatusSchema,
});

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const nonEmpty = z.string().trim().min(1);
const requiredId = () => nonEmpty.max(100);
const positiveInt = () => z.number().int().positive();

const localizedText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${label}.`)
    .max(max, `The ${label} must be ${max} characters or fewer.`);

const optionalLocalizedText = (max: number) =>
  z.string().trim().max(max, `The CTA label must be ${max} characters or fewer.`);

export function isValidAnnouncementHref(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** An announcement may run forever, but it may not expire before it starts. */
export function hasValidScheduleWindow(input: {
  startsAt: number;
  endsAt: number | null;
}): boolean {
  return input.endsAt === null || input.endsAt > input.startsAt;
}

export const announcementFieldsShape = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80, "The slug must be 80 characters or fewer.")
    .regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and dashes."),
  titleId: localizedText("Indonesian title", 120),
  titleEn: localizedText("English title", 120),
  bodyId: localizedText("Indonesian message", 280),
  bodyEn: localizedText("English message", 280),
  ctaHref: z
    .string()
    .trim()
    .max(500, "The CTA link must be 500 characters or fewer.")
    .refine(
      (value) => value === "" || isValidAnnouncementHref(value),
      "Enter a full https:// address or a path starting with /.",
    ),
  ctaLabelId: optionalLocalizedText(60),
  ctaLabelEn: optionalLocalizedText(60),
  startsAt: z.number().int().positive("Pick a start date."),
  endsAt: positiveInt().nullable(),
  enabled: z.boolean(),
});
export type AnnouncementFieldsInput = z.infer<typeof announcementFieldsShape>;

/** Window rule kept out of the shape: TanStack Start validators cannot consume refined objects. */
export const announcementFieldsSchema = announcementFieldsShape.refine(hasValidScheduleWindow, {
  message: "The expiry date must be after the start date.",
  path: ["endsAt"],
});

export const createAnnouncementSchema = announcementFieldsShape;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = announcementFieldsShape.safeExtend({
  announcementId: requiredId(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter a slug.")
    .max(80, "The slug must be 80 characters or fewer.")
    .regex(slugPattern, "Use lowercase letters, numbers, and dashes."),
});
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

export const announcementLifecycleSchema = z.object({
  announcementId: requiredId(),
  action: z.enum(["enable", "disable", "delete"]),
});
export type AnnouncementLifecycleInput = z.infer<typeof announcementLifecycleSchema>;
