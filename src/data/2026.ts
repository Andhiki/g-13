import {
  groupsFor,
  makePlacement,
  merge,
  slug,
  text,
  type Curriculum,
  type Placement,
  type Raw,
} from "./model";

export function adaptCurriculum2026(source: Raw): Curriculum {
  const schedule = source.course_schedule as Raw;
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
        "Wajib",
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
  for (const row of schedule.outside_program_activity_elective_rows as Raw[]) {
    const terms = text(row.semester_guidance_raw);
    const range = terms.match(/^(\d)-(\d)$/);
    const semesters = range
      ? Array.from(
          { length: Number(range[2]) - Number(range[1]) + 1 },
          (_, i) => Number(range[1]) + i,
        )
      : terms.split(",").map(Number);
    for (const term of semesters)
      rows.push({
        id: text(row.course_code_raw),
        code: text(row.course_code_raw),
        title: text(row.course_title_id_raw),
        englishTitle: text(row.course_title_en_raw),
        placement: makePlacement(
          "elective",
          "Aktivitas di luar program studi",
          "Aktivitas di luar program studi",
          term,
          row.credits_total,
          row.prerequisite_raw,
          null,
          row.source_page,
        ),
      });
  }
  const all = merge(rows),
    core = all.filter((course) =>
      course.placements.some((placement) => placement.section === "core"),
    ),
    electives = all.filter((course) =>
      course.placements.some((placement) => placement.section !== "core"),
    );
  return {
    id: "2026",
    edition: "Kurikulum 2026",
    all,
    core,
    electives,
    groups: groupsFor(electives),
    requiredCredits: source.curriculum_summary.required_program_credits_source,
    totalCredits: source.curriculum_summary.minimum_credits_total,
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
