import { z } from "zod";

export const resourceStatusSchema = z.enum(["active", "deleted"]);
export type ResourceStatus = z.infer<typeof resourceStatusSchema>;

export const resourcePageSchema = z.object({
  offset: z.number().int().min(0),
  status: resourceStatusSchema,
});

const localizedText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${label}.`)
    .max(max, `The ${label} must be ${max} characters or fewer.`);

/** Only absolute https URLs with a host are accepted, so public links never point at local paths. */
export function isHttpsResourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.length > 0;
  } catch {
    return false;
  }
}

export const resourceFieldsSchema = z.object({
  titleId: localizedText("Indonesian title", 120),
  titleEn: localizedText("English title", 120),
  descriptionId: localizedText("Indonesian description", 400),
  descriptionEn: localizedText("English description", 400),
  url: z
    .string()
    .trim()
    .min(1, "Enter the link.")
    .max(500, "The link must be 500 characters or fewer.")
    .refine(isHttpsResourceUrl, "Enter a full https:// address."),
  sortOrder: z
    .number()
    .int("Enter a whole number for the order.")
    .min(0, "The order must be between 0 and 9999.")
    .max(9999, "The order must be between 0 and 9999."),
});
export type ResourceFieldsInput = z.infer<typeof resourceFieldsSchema>;

export const createResourceSchema = resourceFieldsSchema;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;

const nonEmpty = z.string().trim().min(1);
const requiredId = () => nonEmpty.max(100);

export const updateResourceSchema = resourceFieldsSchema.extend({
  resourceId: requiredId(),
});
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

export const resourceLifecycleSchema = z.object({
  resourceId: requiredId(),
  action: z.enum(["delete", "restore"]),
});
export type ResourceLifecycleInput = z.infer<typeof resourceLifecycleSchema>;
