import type { Language } from "@g13/i18n";

export type ReviewCourse = { code: string; nameId: string; nameEn: string };
export type ReviewCourseOption = ReviewCourse & { id: string };

export function courseDisplayName(course: ReviewCourse, language: Language): string {
  return language === "en" ? course.nameEn : course.nameId;
}
