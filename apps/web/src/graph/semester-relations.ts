import type { Relation } from "@g13/curriculum";

export function semesterRelations(
  relations: Relation[],
  semesters: ReadonlyMap<string, number | null>,
) {
  return relations.filter(({ source, target }) => {
    const sourceSemester = semesters.get(source);
    const targetSemester = semesters.get(target);
    return sourceSemester == null || targetSemester == null || sourceSemester !== targetSemester;
  });
}
