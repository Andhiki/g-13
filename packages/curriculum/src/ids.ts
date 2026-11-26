export const curriculumIds = ["2021", "2026"] as const;
export type CurriculumId = (typeof curriculumIds)[number];
export const defaultCurriculumId: CurriculumId = "2026";

export function isCurriculumId(value: unknown): value is CurriculumId {
  return typeof value === "string" && curriculumIds.some((id) => id === value);
}
