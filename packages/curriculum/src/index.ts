import syllabi2021 from "./curricula/2021/syllabi.json";
import syllabi2026 from "./curricula/2026/syllabi.json";
import { registry, type CurriculumId } from "./registry";
import type { Course, Curriculum } from "./contracts/model";
import type { AcademicRules, Syllabus } from "./contracts/rules";
import { deriveRelations, type Relation } from "./relations";

export type { Course, Curriculum, Placement } from "./contracts/model";
export type { AcademicOption, AcademicRules, Syllabus } from "./contracts/rules";
export { defaultCurriculumId, isCurriculumId, type CurriculumId } from "./registry";
export { normalizeCourseTitle, type Relation } from "./relations";

export function listCurricula(): Curriculum[] {
  return Object.values(registry).map((slice) => slice.curriculum);
}
export function getCurriculum(id: CurriculumId): Curriculum {
  return registry[id].curriculum;
}
export function getCourse(curriculum: CurriculumId, courseId: string): Course | undefined {
  return getCurriculum(curriculum).all.find((course) => course.id === courseId);
}
export function getSyllabus(curriculum: CurriculumId, courseCode: string): Syllabus | undefined {
  const syllabi: Record<string, Syllabus> = curriculum === "2021" ? syllabi2021 : syllabi2026;
  const key = courseCode.replaceAll("-", "");
  return Object.hasOwn(syllabi, key) ? syllabi[key] : undefined;
}
export function getAcademicRules(curriculum: CurriculumId): AcademicRules {
  return registry[curriculum].rules;
}
const relations = new Map<CurriculumId, Relation[]>();
export function getRelations(curriculum: CurriculumId): Relation[] {
  let result = relations.get(curriculum);
  if (!result) {
    result = deriveRelations(getCurriculum(curriculum));
    relations.set(curriculum, result);
  }
  return result;
}
