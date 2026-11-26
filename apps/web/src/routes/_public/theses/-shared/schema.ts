import { thesisTypes } from "@g13/db/schema/theses";
import { z } from "zod";

const slug = z.string().trim().min(1);

export const thesisSlugInputSchema = z.object({
  slug: slug.max(200),
});

export const thesisSearchSchema = z.object({
  q: z.string().max(300).optional().catch(undefined),
  year: z.number().int().optional().catch(undefined),
  type: z.enum(thesisTypes).optional().catch(undefined),
  field: z.string().max(200).optional().catch(undefined),
});

export type ThesisSearch = z.output<typeof thesisSearchSchema>;
