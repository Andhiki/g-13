import type { Course, Curriculum, Relation } from "../../data";
import { assignedCoreSemester, isCore } from "./course-utils";

export type Scope = "all" | "choices" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

function allowedByGroup(course: Course, group: string) {
  if (isCore(course) || group === "__all__") return true;
  return course.placements.some(
    (placement) => placement.section !== "core" && placement.group === group,
  );
}

export function coursesForScope(
  data: Curriculum,
  relations: Relation[],
  group: string,
  scope: Scope,
) {
  const eligible = data.all.filter((course) => allowedByGroup(course, group));
  if (scope === "all") return eligible;

  const seeds = new Set(
    eligible
      .filter((course) => {
        if (scope === "choices") return !isCore(course);
        return assignedCoreSemester(course) === Number(scope);
      })
      .map((course) => course.id),
  );
  const visible = new Set(seeds);
  for (const relation of relations) {
    if (seeds.has(relation.source) || seeds.has(relation.target)) {
      if (eligible.some((course) => course.id === relation.source)) visible.add(relation.source);
      if (eligible.some((course) => course.id === relation.target)) visible.add(relation.target);
    }
  }
  return eligible.filter((course) => visible.has(course.id));
}
