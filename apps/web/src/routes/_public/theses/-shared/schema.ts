import { z } from "zod";

export const thesisSlugInputSchema = z.object({
  slug: z.string().trim().min(1).max(200),
});
