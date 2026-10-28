import { registry } from "./registry-data";
export { registry } from "./registry-data";
export type CurriculumId = keyof typeof registry;
export const defaultCurriculumId: CurriculumId = "2026";

export function isCurriculumId(value: unknown): value is CurriculumId {
  return typeof value === "string" && Object.hasOwn(registry, value);
}
