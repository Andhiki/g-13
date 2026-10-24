import source21 from "../output/data/ugm-ilkom-2021.json";
import source26 from "../output/data/ugm-ilkom-2026.json";
import { adaptCurriculum2021 } from "./data/2021";
import { adaptCurriculum2026 } from "./data/2026";
import type { Course, Curriculum, CurriculumId } from "./data/model";
export type { Course, Curriculum, CurriculumId, Placement } from "./data/model";

export const curricula: Record<CurriculumId, Curriculum> = {
  "2021": adaptCurriculum2021(source21),
  "2026": adaptCurriculum2026(source26),
};
export function defaultCourseId(data: Curriculum): string {
  return (
    data.core.find((c) => c.title.toLowerCase().includes("algoritma dan struktur data"))?.id ??
    data.core.find((c) => c.placements.some((p) => p.prerequisiteRaw && p.prerequisiteRaw !== "-"))
      ?.id ??
    data.core[0]?.id ??
    ""
  );
}
export function courseSemesters(course: Course): number[] {
  return [
    ...new Set(course.placements.map((p) => p.semester).filter((n): n is number => n !== null)),
  ].sort((a, b) => a - b);
}
export function normalizeCourseTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s*\(\s*\d+\s*\)\s*/g, " ")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:]+$/g, "");
}
export type Relation = { source: string; target: string };
export function deriveRelations(data: Curriculum): Relation[] {
  const titles = new Map<string, Course[]>();
  for (const course of data.all) {
    const key = normalizeCourseTitle(course.title);
    titles.set(key, [...(titles.get(key) ?? []), course]);
  }
  const relations = new Map<string, Relation>();
  for (const course of data.all)
    for (const placement of course.placements) {
      const raw = placement.prerequisiteRaw;
      if (!raw || raw === "-" || raw.toLowerCase().includes("sks")) continue;
      for (const token of raw
        .split(/[,\n;]+/)
        .map(normalizeCourseTitle)
        .filter(Boolean)) {
        const matches = titles.get(token) ?? [];
        if (matches.length !== 1 || matches[0].id === course.id) continue;
        const edge = { source: matches[0].id, target: course.id };
        relations.set(edge.source + "->" + edge.target, edge);
      }
    }
  return [...relations.values()];
}
