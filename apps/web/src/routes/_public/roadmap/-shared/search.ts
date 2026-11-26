import { isCurriculumId, type CurriculumId } from "@g13/curriculum/ids";
import {
  allowsDoubleDegreeWithoutInterest,
  curriculumElectiveIds,
  hasCurriculumInterest,
  internshipOptionValues,
} from "@g13/curriculum/search-index";
import { exposureValues, type Exposure } from "./exposure";

export type RoadmapSearch = {
  kurikulum?: CurriculumId;
  minat?: string;
  iup?: "ya" | "tidak";
  paparan?: Exposure;
  magang?: "ya" | "tidak";
  durasi?: string;
  lulus: 7 | 8;
  semesterPaparan: 6 | 7;
  ganti?: Record<string, string>;
  langkah?: string;
  hasil?: true;
};
const yesNo = (value: unknown) => (value === "ya" || value === "tidak" ? value : undefined);
const exposure = (value: unknown): Exposure | undefined => exposureValues.find((x) => x === value);
export function validateRoadmapSearch(input: Record<string, unknown>): RoadmapSearch {
  const value = typeof input.kurikulum === "number" ? String(input.kurikulum) : input.kurikulum;
  const kurikulum = isCurriculumId(value) ? value : undefined;
  const iup = yesNo(input.iup);
  const magang = yesNo(input.magang);
  const paparan = kurikulum && iup === "ya" ? exposure(input.paparan) : undefined;
  const minat =
    kurikulum &&
    (hasCurriculumInterest(kurikulum, input.minat) ||
      (paparan === "double" &&
        allowsDoubleDegreeWithoutInterest(kurikulum) &&
        input.minat === "tanpa-minat"))
      ? String(input.minat)
      : undefined;
  const durations = kurikulum && magang === "ya" ? internshipOptionValues(kurikulum) : [];
  const durasi = durations.some((x) => x === input.durasi) ? String(input.durasi) : undefined;
  const ganti: Record<string, string> = {};
  if (kurikulum && input.ganti && typeof input.ganti === "object" && !Array.isArray(input.ganti)) {
    const ids = new Set(curriculumElectiveIds(kurikulum));
    for (const [from, to] of Object.entries(input.ganti).slice(0, 50)) {
      if (typeof to === "string" && ids.has(from) && ids.has(to) && from !== to) ganti[from] = to;
    }
  }
  return {
    kurikulum,
    minat,
    iup,
    paparan,
    magang,
    durasi,
    lulus: input.lulus === 7 || input.lulus === "7" ? 7 : 8,
    semesterPaparan: input.semesterPaparan === 7 || input.semesterPaparan === "7" ? 7 : 6,
    ganti: Object.keys(ganti).length ? ganti : undefined,
    langkah: typeof input.langkah === "string" ? input.langkah : undefined,
    hasil: input.hasil === true || input.hasil === "true" ? true : undefined,
  };
}
