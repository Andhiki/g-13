import { curriculum2021 } from "./curricula/2021";
import { curriculum2026 } from "./curricula/2026";
import type { CurriculumSlice } from "./contracts/rules";

export const registry: { "2021": CurriculumSlice; "2026": CurriculumSlice } = {
  "2021": curriculum2021,
  "2026": curriculum2026,
};
export type CurriculumId = keyof typeof registry;
export const defaultCurriculumId: CurriculumId = "2026";

export function isCurriculumId(value: unknown): value is CurriculumId {
  return typeof value === "string" && Object.hasOwn(registry, value);
}
