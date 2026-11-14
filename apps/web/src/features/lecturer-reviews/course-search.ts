import type { Language } from "@g13/i18n";

export type ReviewCourse = { code: string; nameId: string; nameEn: string };

export function matchesCourseSearch(course: ReviewCourse, query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return true;
  return [course.code, course.nameId, course.nameEn].some((value) =>
    value.toLocaleLowerCase().includes(normalizedQuery),
  );
}

export function courseDisplayName(course: ReviewCourse, language: Language): string {
  return language === "en" ? course.nameEn : course.nameId;
}
