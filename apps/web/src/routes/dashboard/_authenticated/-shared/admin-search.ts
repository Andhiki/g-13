import { z } from "zod";

export const adminSearchMaxLength = 512;
export const adminPageSchema = z.object({
  offset: z.number().int().min(0),
  query: z.string().trim().max(adminSearchMaxLength).optional(),
});

/** URL search for dashboard lists; `q` holds the committed (debounced) search. */
export const adminListSearchSchema = z.object({
  q: z.string().trim().max(adminSearchMaxLength).optional().catch(undefined),
});
