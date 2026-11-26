import { thesisTypes } from "@g13/db/schema/theses";
import { z } from "zod";

const slug = z.string().trim().min(1);

export const thesisSlugInputSchema = z.object({
  slug: slug.max(200),
});

const query = z.string().max(300);
const field = z.string().max(200);
const year = z.number().int();

export const thesisSearchSchema = z.object({
  q: query.optional().catch(undefined),
  year: year.optional().catch(undefined),
  type: z.enum(thesisTypes).optional().catch(undefined),
  field: field.optional().catch(undefined),
});

export type ThesisSearch = z.output<typeof thesisSearchSchema>;
