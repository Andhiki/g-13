import source26 from "../output/data/ugm-ilkom-2026.json";
import source21 from "../output/data/ugm-ilkom-2021.json";
import { adaptCurriculum2021 } from "./data/2021";
import {
  groupsFor,
  makePlacement,
  merge,
  slug,
  text,
  type Course,
  type Curriculum,
  type CurriculumId,
  type Placement,
  type Raw,
} from "./data/model";
export type { Course, Curriculum, CurriculumId, Placement } from "./data/model";

function make2026(): Curriculum {
  const data = source26 as Raw,
    schedule = data.course_schedule as Raw;
  const rows: {
    id: string;
    code: string;
    title: string;
    englishTitle: string;
    placement: Placement;
  }[] = [];
  (schedule.required_program_rows as Raw[]).forEach((row, index) => {
    const code = text(row.course_code_raw),
      title = text(row.course_title_id_raw) || "Mata kuliah tanpa nama";
    rows.push({
      id: code || "2026-core-" + slug(title) + "-" + index,
      code,
      title,
      englishTitle: text(row.course_title_en_raw),
      placement: makePlacement(
        "core",
        "Wajib program studi",
        "",
        row.semester_guidance_raw,
        row.credits_total,
        row.prerequisite_raw,
        null,
        row.source_page,
      ),
    });
  });
  (schedule.interest_area_rows as Raw[]).forEach((row, index) => {
    const code = text(row.course_code_raw),
      title = text(row.course_title_id_raw) || "Mata kuliah minat";
    rows.push({
      id: code || "2026-interest-" + slug(title) + "-" + index,
      code,
      title,
      englishTitle: text(row.course_title_en_raw),
      placement: makePlacement(
        row.course_type_raw === "WM" ? "interest" : "elective",
        row.course_type_raw === "WM" ? "Wajib minat (WM)" : "Pilihan bebas (P)",
        row.course_type_raw === "WM" ? text(row.interest_area_raw) : "Pilihan bebas",
        row.semester_guidance_raw,
        row.credits_total,
        row.prerequisite_raw,
        null,
        row.source_page,
      ),
    });
  });
  const all = merge(rows),
    core = all.filter((c) => c.placements.some((p) => p.section === "core")),
    electives = all.filter((c) => c.placements.some((p) => p.section !== "core"));
  return {
    id: "2026",
    edition: "Kurikulum 2026",
    all,
    core,
    electives,
    groups: groupsFor(electives),
    requiredCredits: data.curriculum_summary.required_program_credits_source,
    totalCredits: data.curriculum_summary.minimum_credits_total,
    summary: "Buku Kurikulum S1 FMIPA 2026 · Program Studi Ilmu Komputer.",
    sourceTitle: "Buku Kurikulum S1 FMIPA 2026",
    sourceUrl: null,
    readingNotes: [
      "Tanda * berarti mata kuliah prasyarat pernah diambil sebelumnya, tetapi tidak harus lulus (PDF hlm. 188). Maknanya berbeda dari kurikulum 2021 Revisi 2023.",
      "WM wajib bagi mahasiswa yang memilih minat; P adalah mata kuliah pilihan bebas. Pemilihan minat dilakukan pada awal semester 4 (PDF hlm. 185, 191).",
      "Semester pada tabel adalah panduan penempatan, bukan penawaran aktual. Aturan seperti batas SKS tetap tampil sebagai teks sumber dan tidak dihitung sebagai kelayakan pribadi.",
    ],
  };
}
export const curricula: Record<CurriculumId, Curriculum> = {
  "2021": adaptCurriculum2021(source21),
  "2026": make2026(),
};
export function defaultCourseId(data: Curriculum): string {
  return (
    data.core.find((c) => c.title.toLowerCase().includes("algoritma dan struktur data"))?.id ??
    data.core.find((c) => c.placements.some((p) => p.prerequisiteRaw && p.prerequisiteRaw !== "-"))
      ?.id ??
    data.core[0]?.id ??
    ""
  );
}
export function courseSemesters(course: Course): number[] {
  return [
    ...new Set(course.placements.map((p) => p.semester).filter((n): n is number => n !== null)),
  ].sort((a, b) => a - b);
}
function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s*\(\s*\d+\s*\)\s*/g, " ")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:]+$/g, "");
}
export type Relation = { source: string; target: string };
export function deriveRelations(data: Curriculum): Relation[] {
  const titles = new Map<string, Course[]>();
  for (const course of data.all) {
    const key = normalized(course.title);
    titles.set(key, [...(titles.get(key) ?? []), course]);
  }
  const relations = new Map<string, Relation>();
  for (const course of data.all)
    for (const placement of course.placements) {
      const raw = placement.prerequisiteRaw;
      if (!raw || raw === "-" || raw.toLowerCase().includes("sks")) continue;
      for (const token of raw
        .split(/[,\n;]+/)
        .map(normalized)
        .filter(Boolean)) {
        const matches = titles.get(token) ?? [];
        if (matches.length !== 1 || matches[0].id === course.id) continue;
        const edge = { source: matches[0].id, target: course.id };
        relations.set(edge.source + "->" + edge.target, edge);
      }
    }
  return [...relations.values()];
}
