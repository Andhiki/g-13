import { curricula, type CurriculumId } from "../../data";

export type Choice = { value: string; label: string; detail: string };
export const interests = (curriculum: CurriculumId): Choice[] =>
  curricula[curriculum].groups
    .filter((group) =>
      curriculum === "2021"
        ? group.name.startsWith("Lab ")
        : !["Pilihan bebas", "Aktivitas di luar program studi"].includes(group.name),
    )
    .map((group) => ({
      value: group.name,
      label: group.name.replace(/^Lab /, ""),
      detail:
        curriculum === "2021"
          ? "Rekomendasi pilihan dari laboratorium ini."
          : "Termasuk mata kuliah wajib minat.",
    }));

export const internshipTiers: Choice[] = [
  { value: "pendek", label: "Durasi pendek", detail: "4 SKS Magang + 4 SKS Kerja Praktik." },
  { value: "menengah", label: "Durasi menengah", detail: "8 SKS Magang + 4 SKS Kerja Praktik." },
  { value: "panjang", label: "Durasi panjang", detail: "12 SKS Magang + 4 SKS Kerja Praktik." },
  { value: "penuh", label: "Satu semester penuh", detail: "16 SKS Magang + 4 SKS Kerja Praktik." },
];
export const internshipCodes: Record<string, string> = {
  pendek: "PACS262608",
  menengah: "PACS262606",
  panjang: "PACS262607",
  penuh: "PACS262609",
};
export const duration2021: Choice[] = [
  {
    value: "singkat",
    label: "Kurang dari satu semester",
    detail: "Durasi rencana. Konversi SKS perlu persetujuan prodi.",
  },
  {
    value: "semester",
    label: "Satu semester",
    detail: "Semester 6 disiapkan untuk Magang. Konversi SKS belum ditentukan.",
  },
];
export function exposureOptions(curriculum: CurriculumId): Choice[] {
  return [
    {
      value: "exchange",
      label: "Pertukaran mahasiswa",
      detail: "Satu semester di universitas tujuan.",
    },
    {
      value: "internship",
      label: "Magang internasional",
      detail:
        curriculum === "2026"
          ? "Hingga satu semester. Durasi dan pengakuan perlu dikonfirmasi."
          : "Durasi bergantung program. Sumber memuat beberapa skema.",
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
      detail:
        curriculum === "2026"
          ? "1–4 semester di kampus mitra. Perlu rencana khusus."
          : "3–4 semester di kampus mitra. Perlu rencana khusus.",
    },
    {
      value: "undecided",
      label: "Belum menentukan",
      detail: "Tetap tampil sebagai kegiatan yang perlu direncanakan.",
    },
  ];
}

export function electiveOptions(curriculum: "2021" | "2026") {
  return curricula[curriculum].electives.filter(
    (course) =>
      course.code &&
      course.placements.some((p) => p.group.startsWith("Lab ") || p.group === "Pilihan bebas"),
  );
}
