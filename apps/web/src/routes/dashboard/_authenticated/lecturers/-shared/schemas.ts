import { z } from "zod";

export const lecturerStatusSchema = z.enum(["active", "deleted"]);
export type LecturerStatus = z.infer<typeof lecturerStatusSchema>;

export const lecturerPageSchema = z.object({
  offset: z.number().int().min(0),
  status: lecturerStatusSchema,
});

export const lecturerFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a lecturer name.")
    .max(120, "Lecturer name must be 120 characters or fewer."),
});

export type LecturerFieldsInput = z.infer<typeof lecturerFieldsSchema>;

export const createLecturerSchema = lecturerFieldsSchema;
export type CreateLecturerInput = z.infer<typeof createLecturerSchema>;

export const updateLecturerSchema = lecturerFieldsSchema.extend({
  lecturerId: z.string().trim().min(1).max(100),
});
export type UpdateLecturerInput = z.infer<typeof updateLecturerSchema>;

export const lecturerLifecycleSchema = z.object({
  lecturerId: z.string().trim().min(1).max(100),
  action: z.enum(["delete", "restore"]),
});
export type LecturerLifecycleInput = z.infer<typeof lecturerLifecycleSchema>;
