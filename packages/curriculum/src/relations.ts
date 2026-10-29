import type { Course, Curriculum } from "./contracts/model";
function normalizeCourseTitle(value: string): string {
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
export type Relation = { source: string; target: string; timing: "before" | "concurrent" };

export function indexCourseTitles(all: Course[]): Map<string, Course[]> {
  const titles = new Map<string, Course[]>();
  for (const course of all) {
    const key = normalizeCourseTitle(course.title);
    titles.set(key, [...(titles.get(key) ?? []), course]);
  }
  return titles;
}

export function resolvePrerequisites(
  course: Course,
  titles: ReadonlyMap<string, Course[]>,
  starredConcurrent: boolean,
): { relations: Relation[]; unresolved: string[] } {
  const relations = new Map<string, Relation>();
  const unresolved = new Set<string>();
  for (const placement of course.placements) {
    for (const raw of placement.prerequisiteRaw.split(/[,\n;]+/).map((part) => part.trim())) {
      if (!raw || raw === "-") continue;
      const matches = raw.toLowerCase().includes("sks")
        ? []
        : (titles.get(normalizeCourseTitle(raw)) ?? []);
      if (matches.length !== 1 || matches[0].id === course.id) {
        unresolved.add(raw);
        continue;
      }
      const source = matches[0].id;
      const timing = starredConcurrent && raw.includes("*") ? "concurrent" : "before";
      const previous = relations.get(source);
      relations.set(source, {
        source,
        target: course.id,
        timing: previous?.timing === "before" ? "before" : timing,
      });
    }
  }
  return { relations: [...relations.values()], unresolved: [...unresolved] };
}

export function deriveRelations(data: Curriculum, starredConcurrent: boolean): Relation[] {
  const titles = indexCourseTitles(data.all);
  return data.all.flatMap(
    (course) => resolvePrerequisites(course, titles, starredConcurrent).relations,
  );
}
