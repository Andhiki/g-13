import { searchParams } from "./search-index-data";
import type { CurriculumSearchParams } from "./contracts/search";
import type { CurriculumId } from "./ids";

export type { CurriculumSearchParams };

function params(curriculum: CurriculumId): CurriculumSearchParams {
  return searchParams[curriculum];
}

export function curriculumCourseIds(curriculum: CurriculumId): readonly string[] {
  return params(curriculum).courseIds;
}

export function isCurriculumCourse(curriculum: CurriculumId, courseId: string): boolean {
  return params(curriculum).courseIds.includes(courseId);
}

export function curriculumInterestNames(curriculum: CurriculumId): readonly string[] {
  return params(curriculum).interestNames;
}

export function hasCurriculumInterest(curriculum: CurriculumId, name: unknown): boolean {
  return typeof name === "string" && params(curriculum).interestNames.includes(name);
}

export function curriculumElectiveIds(curriculum: CurriculumId): readonly string[] {
  return params(curriculum).electiveIds;
}

export function allowsDoubleDegreeWithoutInterest(curriculum: CurriculumId): boolean {
  return params(curriculum).doubleDegreeWithoutInterest;
}

export function internshipOptionValues(curriculum: CurriculumId): readonly string[] {
  return params(curriculum).internshipOptionValues;
}
