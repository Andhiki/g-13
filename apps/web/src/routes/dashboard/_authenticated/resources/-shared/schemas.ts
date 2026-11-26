import { z } from "zod";

export const resourceStatusSchema = z.enum(["active", "deleted"]);
export type ResourceStatus = z.infer<typeof resourceStatusSchema>;

export const resourcePageSchema = z.object({
  offset: z.number().int().min(0),
  status: resourceStatusSchema,
});

/** Shared by the admin form `maxLength` props and the Zod limits below. */
export const RESOURCE_FIELD_LIMITS = {
  title: 120,
  description: 400,
  url: 500,
} as const;

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

/**
 * Accepts the forms maintainers paste in practice: bare hosts, `http://`, or a trailing slash.
 * Invalid input is returned unchanged so the schema can reject it with a field error.
 */
export function normalizeResourceUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;

  let candidate = trimmed;
  if (candidate.startsWith("//")) {
    candidate = `https:${candidate}`;
  } else if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
    const schemeLike = candidate.match(/^([a-z][a-z0-9+.-]*):/i);
    if (schemeLike && !schemeLike[1].includes(".")) return candidate;
    candidate = `https://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol === "http:") url.protocol = "https:";
    if (url.protocol !== "https:") return candidate;
    const auth = url.username ? `${url.username}${url.password ? `:${url.password}` : ""}@` : "";
    // Strip only the root slash so paths that rely on a trailing slash keep working.
    const path = url.pathname === "/" ? "" : url.pathname;
    return `${url.protocol}//${auth}${url.host}${path}${url.search}${url.hash}`;
  } catch {
    return candidate;
  }
}

export const resourceUrlSchema = z
  .string()
  .transform(normalizeResourceUrl)
  .pipe(
    z
      .string()
      .min(1, "Enter the link.")
      .max(
        RESOURCE_FIELD_LIMITS.url,
        `The link must be ${RESOURCE_FIELD_LIMITS.url} characters or fewer.`,
      )
      .refine(isHttpsResourceUrl, "Enter a full https:// address."),
  );

export const resourceFieldsSchema = z.object({
  titleId: localizedText("Indonesian title", RESOURCE_FIELD_LIMITS.title),
  titleEn: localizedText("English title", RESOURCE_FIELD_LIMITS.title),
  descriptionId: localizedText("Indonesian description", RESOURCE_FIELD_LIMITS.description),
  descriptionEn: localizedText("English description", RESOURCE_FIELD_LIMITS.description),
  url: resourceUrlSchema,
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

/**
 * The client sends the current page in its new visual order. The server permutes the existing
 * sort-order values of exactly those rows, so rows on other pages keep their position.
 */
export const reorderResourcesSchema = z
  .object({
    movedId: requiredId(),
    orderedIds: z
      .array(requiredId())
      .min(1, "Send at least one resource.")
      .max(100, "Reorder at most 100 resources at once.")
      .refine((ids) => new Set(ids).size === ids.length, "Resource ids must be unique."),
  })
  .refine((value) => value.orderedIds.includes(value.movedId), {
    message: "The moved resource must be part of the ordered list.",
    path: ["movedId"],
  });
export type ReorderResourcesInput = z.infer<typeof reorderResourcesSchema>;
