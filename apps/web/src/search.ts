import { defaultCurriculumId, isCurriculumId, type CurriculumId } from "@g13/curriculum/ids";
import { isCurriculumCourse } from "@g13/curriculum/search-index";

type CurriculumSearch = { kurikulum: CurriculumId; mk?: string };

export function validateCurriculumSearch(search: Record<string, unknown>): CurriculumSearch {
  const value = typeof search.kurikulum === "number" ? String(search.kurikulum) : search.kurikulum;
  const kurikulum = isCurriculumId(value) ? value : defaultCurriculumId;
  const mk =
    typeof search.mk === "string" && isCurriculumCourse(kurikulum, search.mk)
      ? search.mk
      : undefined;
  return { kurikulum, mk };
}
