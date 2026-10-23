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

export function adaptCurriculum2021(data: Raw): Curriculum {
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
    core = all.filter((course) =>
      course.placements.some((placement) => placement.section === "core"),
    ),
    electives = all.filter((course) =>
      course.placements.some((placement) => placement.section === "elective"),
    );
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
