import { z } from "zod";

const slug = z.string().trim().min(1);

export const thesisSlugInputSchema = z.object({
  slug: slug.max(200),
});
