import { getCourse, defaultCurriculumId, isCurriculumId, type CurriculumId } from "@g13/curriculum";

type CurriculumSearch = { kurikulum: CurriculumId; mk?: string };

export function validateCurriculumSearch(search: Record<string, unknown>): CurriculumSearch {
  const value = typeof search.kurikulum === "number" ? String(search.kurikulum) : search.kurikulum;
  const kurikulum = isCurriculumId(value) ? value : defaultCurriculumId;
  const mk =
    typeof search.mk === "string" && getCourse(kurikulum, search.mk) ? search.mk : undefined;
  return { kurikulum, mk };
}
