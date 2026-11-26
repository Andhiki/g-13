import { announcementVariants } from "@g13/db/schema/announcements";
import { z } from "zod";

export const ANNOUNCEMENT_TITLE_MAX_LENGTH = 40;
export const ANNOUNCEMENT_BODY_MAX_LENGTH = 100;
export const ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH = 24;
export const ANNOUNCEMENT_CTA_LINK_MAX_LENGTH = 500;

export const announcementStatusSchema = z.enum(["live", "scheduled", "expired", "disabled"]);
export type AnnouncementStatus = z.infer<typeof announcementStatusSchema>;

export const announcementPageSchema = z.object({
  offset: z.number().int().min(0),
  status: announcementStatusSchema,
});

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
  variant: z.enum(announcementVariants).default("primary"),
  titleId: localizedText("Indonesian title", ANNOUNCEMENT_TITLE_MAX_LENGTH),
  titleEn: localizedText("English title", ANNOUNCEMENT_TITLE_MAX_LENGTH),
  bodyId: localizedText("Indonesian message", ANNOUNCEMENT_BODY_MAX_LENGTH),
  bodyEn: localizedText("English message", ANNOUNCEMENT_BODY_MAX_LENGTH),
  ctaOpenInNewTab: z.boolean().default(false),
  ctaHref: z
    .string()
    .trim()
    .max(
      ANNOUNCEMENT_CTA_LINK_MAX_LENGTH,
      `The CTA link must be ${ANNOUNCEMENT_CTA_LINK_MAX_LENGTH} characters or fewer.`,
    )
    .refine(
      (value) => value === "" || isValidAnnouncementHref(value),
      "Enter a full https:// address or a path starting with /.",
    ),
  ctaLabelId: optionalLocalizedText(ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH),
  ctaLabelEn: optionalLocalizedText(ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH),
  startsAt: z.number().int().positive("Pick a start date."),
  endsAt: positiveInt().nullable(),
  countdownAt: positiveInt().nullable().default(null),
  enabled: z.boolean(),
});
export type AnnouncementFieldsInput = z.infer<typeof announcementFieldsShape>;

/** Window rule kept out of the shape: TanStack Start validators cannot consume refined objects. */
export const announcementFieldsSchema = announcementFieldsShape.refine(hasValidScheduleWindow, {
  message: "The expiry date must be after the start date.",
  path: ["endsAt"],
});

const confirmedConflictIds = z.array(requiredId()).optional();

export const createAnnouncementSchema = announcementFieldsShape.extend({ confirmedConflictIds });
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = createAnnouncementSchema.extend({
  announcementId: requiredId(),
});
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

export const announcementLifecycleSchema = z.object({
  announcementId: requiredId(),
  action: z.enum(["enable", "disable", "delete"]),
  confirmedConflictIds,
});
export type AnnouncementLifecycleInput = z.infer<typeof announcementLifecycleSchema>;
