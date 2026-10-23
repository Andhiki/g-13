import { curricula, type CurriculumId } from "./data";

type CurriculumSearch = { kurikulum: CurriculumId; mk?: string };

export function validateCurriculumSearch(search: Record<string, unknown>): CurriculumSearch {
  const kurikulum = String(search.kurikulum) === "2021" ? "2021" : "2026";
  const mk =
    typeof search.mk === "string" &&
    curricula[kurikulum].all.some((course) => course.id === search.mk)
      ? search.mk
      : undefined;
  return { kurikulum, mk };
}
