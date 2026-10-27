import type { Course, Curriculum } from "./contracts/model";
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
