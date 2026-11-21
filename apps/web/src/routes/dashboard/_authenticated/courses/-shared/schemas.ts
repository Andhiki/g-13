import { z } from "zod";

export const courseStatusSchema = z.enum(["active", "deleted"]);
export type CourseStatus = z.infer<typeof courseStatusSchema>;

export const coursePageSchema = z.object({
  offset: z.number().int().min(0),
  status: courseStatusSchema,
});

export const courseFieldsSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Enter a course code.")
    .max(40, "Course code must be 40 characters or fewer."),
  nameId: z
    .string()
    .trim()
    .min(1, "Enter an Indonesian course name.")
    .max(200, "Course name must be 200 characters or fewer."),
  nameEn: z
    .string()
    .trim()
    .min(1, "Enter an English course name.")
    .max(200, "Course name must be 200 characters or fewer."),
});

export type CourseFieldsInput = z.infer<typeof courseFieldsSchema>;

export const createCourseSchema = courseFieldsSchema;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = courseFieldsSchema.omit({ code: true }).extend({
  courseId: z.string().trim().min(1).max(100),
});
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const courseLifecycleSchema = z.object({
  courseId: z.string().trim().min(1).max(100),
  action: z.enum(["delete", "restore"]),
});
export type CourseLifecycleInput = z.infer<typeof courseLifecycleSchema>;
