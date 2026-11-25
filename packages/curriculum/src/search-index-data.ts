import type { CurriculumSearchParams } from "./contracts/search";
import type { CurriculumId } from "./ids";
import { registry } from "./registry-data";

/**
 * Projection of the curriculum registry that search-parameter validation needs.
 * `tsdown.config.ts` replaces this module with the equivalent literal, so validators
 * never pull the full curriculum data into the browser entry.
 */
export const searchParams: Record<CurriculumId, CurriculumSearchParams> = Object.fromEntries(
  Object.entries(registry).map(([id, { curriculum, rules }]) => [
    id,
    {
      courseIds: curriculum.all.map((course) => course.id),
      interestNames: curriculum.groups
        .filter((group) => group.kind === "interest")
        .map((group) => group.name),
      electiveIds: curriculum.electives
        .filter(
          (course) =>
            course.code &&
            course.placements.some(
              (placement) =>
                placement.groupKind === "interest" || placement.groupKind === "elective",
            ),
        )
        .map((course) => course.id),
      doubleDegreeWithoutInterest: rules.doubleDegreeWithoutInterest,
      internshipOptionValues:
        rules.internship.kind === "credited" ? rules.internship.options.map((x) => x.value) : [],
    },
  ]),
) as Record<CurriculumId, CurriculumSearchParams>;
