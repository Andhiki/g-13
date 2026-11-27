import { z } from "zod";

export const adminSearchMaxLength = 512;
export const adminPageSchema = z.object({
  offset: z.number().int().min(0),
  query: z.string().trim().max(adminSearchMaxLength).optional(),
});
