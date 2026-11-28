import { z } from "zod";
import { adminPageSchema } from "../../-shared/admin-search";

export const lecturerStatusSchema = z.enum(["active", "deleted"]);
export type LecturerStatus = z.infer<typeof lecturerStatusSchema>;

export const lecturerPageSchema = adminPageSchema.extend({
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

const nonEmpty = z.string().trim().min(1);
const requiredId = () => nonEmpty.max(100);

export const updateLecturerSchema = lecturerFieldsSchema.extend({
  lecturerId: requiredId(),
});
export type UpdateLecturerInput = z.infer<typeof updateLecturerSchema>;

export const lecturerLifecycleSchema = z.object({
  lecturerId: requiredId(),
  action: z.enum(["delete", "restore"]),
});
export type LecturerLifecycleInput = z.infer<typeof lecturerLifecycleSchema>;

/** Fields the admin search matches; the UI may highlight only these. */
export const lecturerSearchFields = ["name", "id"] as const;
