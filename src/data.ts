import source21 from "../output/data/ugm-ilkom-2021.json";
import source26 from "../output/data/ugm-ilkom-2026.json";

export type CurriculumId = "2021" | "2026";
type Section = "core" | "interest" | "elective";
export type Placement = {
  section: Section;
  label: string;
  group: string;
  semester: number | null;
  semesterLabel: string;
  credits: number | null;
  prerequisiteRaw: string;
  printedPage: number | null;
  pdfPage: number | null;
};
export type Course = {
  id: string;
  code: string;
  title: string;
  englishTitle: string;
  placements: Placement[];
};
export type Curriculum = {
  id: CurriculumId;
  edition: string;
  all: Course[];
  core: Course[];
  electives: Course[];
  groups: { name: string; count: number }[];
  requiredCredits: number;
  totalCredits: number;
  summary: string;
  sourceTitle: string;
  sourceUrl: string | null;
  readingNotes: string[];
};
type Raw = Record<string, any>;
const text = (value: unknown) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
function semester(value: unknown) {
  const label = text(value),
    match = label.match(/(?:^|\b)([1-8])(?:\b|$)/);
  return { number: match ? Number(match[1]) : null, label };
}
function makePlacement(
  section: Section,
  label: string,
  group: string,
  sem: unknown,
  credits: unknown,
  prereq: unknown,
  refs: unknown,
  page?: Raw,
): Placement {
  const s = semester(sem),
    list = Array.isArray(refs) ? refs : refs ? [refs] : page ? [page] : [],
    ref = list[0] ?? {};
  return {
    section,
    label,
    group,
    semester: s.number,
    semesterLabel: s.label,
    credits: Number.isFinite(Number(credits)) ? Number(credits) : null,
    prerequisiteRaw: text(prereq),
    printedPage: ref.printed_page ?? null,
    pdfPage: ref.pdf_page ?? ref.pdf_page_1_based ?? null,
  };
}
function merge(
  rows: { id: string; code: string; title: string; englishTitle: string; placement: Placement }[],
): Course[] {
  const map = new Map<string, Course>();
  for (const row of rows) {
    const course = map.get(row.id);
    if (!course)
      map.set(row.id, {
        id: row.id,
        code: row.code,
        title: row.title,
        englishTitle: row.englishTitle,
        placements: [row.placement],
      });
    else if (
      !course.placements.some((item) => JSON.stringify(item) === JSON.stringify(row.placement))
    )
      course.placements.push(row.placement);
  }
  return [...map.values()].sort(
    (a, b) =>
      Math.min(...a.placements.map((x) => x.semester ?? 99)) -
        Math.min(...b.placements.map((x) => x.semester ?? 99)) ||
      a.title.localeCompare(b.title, "id"),
  );
}
function groupsFor(courses: Course[]) {
  const map = new Map<string, Set<string>>();
  for (const course of courses)
    for (const item of course.placements) {
      if (item.section === "core") continue;
      const ids = map.get(item.group) ?? new Set<string>();
      ids.add(course.id);
      map.set(item.group, ids);
    }
  return [...map]
    .map(([name, ids]) => ({ name, count: ids.size }))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}
function make2021(): Curriculum {
  const data = source21 as Raw;
  const rows: {
    id: string;
    code: string;
    title: string;
    englishTitle: string;
    placement: Placement;
  }[] = [];
  (data.required_schedule.courses as Raw[]).forEach((row, index) => {
    const code = text(row.code_raw),
      title = text(row.name_id) || "Mata kuliah tanpa nama",
      slot = row.record_kind === "elective_slot";
    const id = slot
      ? "2021-slot-" + text(row.course_no_raw || index + 1) + "-s" + text(row.semester)
      : row.code_complete && code && code !== "MII21-"
        ? code
        : "2021-core-" + slug(title) + "-" + index;
    const label = slot
      ? "Slot pilihan"
      : row.choice_group === "religion"
        ? "Pilihan agama"
        : row.wp_raw === "P"
          ? "Pilihan terjadwal (P)"
          : "Wajib terjadwal (W)";
    rows.push({
      id,
      code: code === "MII21-" ? "" : code,
      title,
      englishTitle: text(row.name_en),
      placement: makePlacement(
        "core",
        label,
        "",
        row.semester,
        row.sks,
        row.prerequisite_raw,
        row.source_refs,
      ),
    });
  });
  (data.elective_catalog.courses as Raw[]).forEach((row, index) => {
    const code = text(row.code_raw),
      title = text(row.name_id) || "Mata kuliah pilihan";
    const id =
      row.code_complete && code && code !== "MII21-"
        ? code
        : "2021-elective-" + slug(title) + "-" + index;
    const semesters =
      Array.isArray(row.semester_labels) && row.semester_labels.length
        ? row.semester_labels
        : [row.semester_labels_raw];
    for (const sem of semesters)
      rows.push({
        id,
        code: code === "MII21-" ? "" : code,
        title,
        englishTitle: text(row.name_en),
        placement: makePlacement(
          "elective",
          "Mata kuliah pilihan",
          text(row.group_context) || "Pilihan bebas / lainnya",
          sem,
          row.sks,
          row.prerequisite_raw,
          row.source_refs,
        ),
      });
  });
  const all = merge(rows),
    core = all.filter((c) => c.placements.some((p) => p.section === "core")),
    electives = all.filter((c) => c.placements.some((p) => p.section === "elective"));
  const pdf = (data.sources as Raw[]).find((item) => item.id === "pdf_revision_2023");
  return {
    id: "2021",
    edition: "Revisi 2023",
    all,
    core,
    electives,
    groups: groupsFor(electives),
    requiredCredits: data.credit_summary.required_sks,
    totalCredits: data.credit_summary.total_sks,
    summary: "Sumber utama: Kurikulum Program Sarjana FMIPA UGM 2021 Revisi 2023.",
    sourceTitle: text(pdf?.title),
    sourceUrl: pdf?.url ?? null,
    readingNotes: [
      "Tanda * berarti mata kuliah prasyarat boleh diambil bersamaan. Tanpa tanda *, mata kuliah prasyarat harus sudah diikuti sampai ujian akhir sebelum mata kuliah terkait diambil (PDF hlm. 273).",
      "Agama dipilih sesuai keyakinan. Makna penanda pilihan, MBKM, KKN, dan sertifikasi mengikuti catatan di tabel sumber.",
      "PDF Revisi 2023 menjadi sumber utama dataset 2021; halaman web departemen yang lebih lama memiliki perbedaan yang dicatat di dokumen ekstraksi.",
    ],
  };
}
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
  "2021": make2021(),
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
