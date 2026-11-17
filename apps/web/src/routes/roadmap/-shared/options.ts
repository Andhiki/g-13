import {
  getCurriculum,
  getAcademicRules,
  type AcademicOption,
  type CurriculumId,
} from "@g13/curriculum";

export type Choice = AcademicOption;
export const interests = (curriculum: CurriculumId): Choice[] =>
  getCurriculum(curriculum)
    .groups.filter((group) => group.kind === "interest")
    .map((group) => ({
      value: group.name,
      label: group.name.replace(/^Lab /, ""),
      detail:
        getAcademicRules(curriculum).interestMode === "laboratory"
          ? "Rekomendasi pilihan dari laboratorium ini."
          : "Termasuk mata kuliah wajib minat.",
    }));

export type Exposure =
  | "exchange"
  | "internship"
  | "course"
  | "competition"
  | "conference"
  | "double"
  | "undecided";

export function exposureOptions(curriculum: CurriculumId) {
  return [
    {
      value: "exchange",
      label: "Pertukaran mahasiswa",
      detail: "Satu semester di universitas tujuan.",
    },
    {
      value: "internship",
      label: "Magang internasional",
      detail: getAcademicRules(curriculum).exposure.internshipDetail,
    },
    {
      value: "course",
      label: "Short course atau workshop",
      detail: "Sekitar 1–4 minggu, tanpa mengosongkan satu semester.",
    },
    {
      value: "competition",
      label: "Kompetisi internasional",
      detail: "Sekitar 1–8 minggu. Konfirmasi bukti kegiatan ke prodi.",
    },
    {
      value: "conference",
      label: "Presentasi internasional",
      detail: "Presentasi makalah atau poster, sekitar 1 hari–1 minggu.",
    },
    {
      value: "double",
      label: "Double degree",
      detail: getAcademicRules(curriculum).exposure.doubleDegreeDetail,
    },
    {
      value: "undecided",
      label: "Belum menentukan",
      detail: "Tetap tampil sebagai kegiatan yang perlu direncanakan.",
    },
  ] satisfies (Choice & { value: Exposure })[];
}

export function electiveOptions(curriculum: CurriculumId) {
  return getCurriculum(curriculum).electives.filter(
    (course) =>
      course.code &&
      course.placements.some((p) => p.groupKind === "interest" || p.groupKind === "elective"),
  );
}
