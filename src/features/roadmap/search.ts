import type { CurriculumId } from "../../data";
import {
  duration2021,
  electiveOptions,
  exposureOptions,
  interests,
  internshipTiers,
} from "./options";

export type RoadmapSearch = {
  kurikulum?: CurriculumId;
  minat?: string;
  iup?: "ya" | "tidak";
  paparan?: string;
  magang?: "ya" | "tidak";
  durasi?: string;
  lulus: 7 | 8;
  semesterPaparan: 6 | 7;
  ganti?: Record<string, string>;
  langkah?: string;
  hasil?: true;
};
const yesNo = (value: unknown) => (value === "ya" || value === "tidak" ? value : undefined);
export function validateRoadmapSearch(input: Record<string, unknown>): RoadmapSearch {
  const kurikulum =
    input.kurikulum === "2021" || input.kurikulum === 2021
      ? "2021"
      : input.kurikulum === "2026" || input.kurikulum === 2026
        ? "2026"
        : undefined;
  const iup = yesNo(input.iup);
  const magang = yesNo(input.magang);
  const paparan =
    kurikulum && iup === "ya" && exposureOptions(kurikulum).some((x) => x.value === input.paparan)
      ? String(input.paparan)
      : undefined;
  const minat =
    kurikulum &&
    (interests(kurikulum).some((x) => x.value === input.minat) ||
      (paparan === "double" && kurikulum === "2026" && input.minat === "tanpa-minat"))
      ? String(input.minat)
      : undefined;
  const durations = kurikulum === "2021" ? duration2021 : internshipTiers;
  const durasi =
    magang === "ya" && durations.some((x) => x.value === input.durasi)
      ? String(input.durasi)
      : undefined;
  const ganti: Record<string, string> = {};
  if (kurikulum && input.ganti && typeof input.ganti === "object" && !Array.isArray(input.ganti)) {
    const available = electiveOptions(kurikulum);
    const ids = new Set(available.map((x) => x.id));
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
