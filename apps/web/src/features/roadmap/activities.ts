import { getAcademicRules, defaultCurriculumId } from "@g13/curriculum";
import { exposureOptions, internshipOptions } from "./options";
import type { Activity } from "./planner";
import type { RoadmapSearch } from "./search";

export function planActivities(answers: RoadmapSearch) {
  const activities: Activity[] = [];
  const blocked = new Set<number>();
  const notes: string[] = [];
  const curriculum = answers.kurikulum ?? defaultCurriculumId;
  const rules = getAcademicRules(curriculum);
  if (answers.iup === "ya" && answers.paparan) {
    const option = exposureOptions(curriculum).find((x) => x.value === answers.paparan)!;
    const fullSemester = ["exchange", "internship", "double"].includes(answers.paparan);
    const semester = answers.paparan === "double" ? 5 : answers.semesterPaparan;
    activities.push({
      id: "exposure",
      title: option.label,
      semester,
      detail: option.detail,
      fullSemester,
    });
    if (answers.paparan === "double") {
      for (let term = 5; term <= 8; term++) blocked.add(term);
      notes.push(
        "Double degree memerlukan rencana kampus mitra. Rentang semester 5–8 dicadangkan sementara; durasi sebenarnya dan penyetaraan belum ditentukan.",
      );
    } else if (fullSemester) blocked.add(semester);
    if (answers.paparan === "undecided")
      notes.push("International exposure belum dipilih. Kewajiban IUP ini belum terselesaikan.");
    else
      notes.push(
        "Bukti international exposure dan penyetaraan mata kuliah perlu persetujuan prodi. Tidak ada SKS kampus mitra yang dihitung otomatis.",
      );
    if (answers.paparan === "internship")
      notes.push(
        "Satu kegiatan Magang internasional dapat memenuhi exposure. Konversi SKS Magang tetap memerlukan persetujuan; tidak dihitung dua kali.",
      );
  }
  if (answers.magang === "ya") {
    const semester = answers.paparan === "internship" ? answers.semesterPaparan : 6;
    if (rules.internship.kind === "activity") {
      const option = internshipOptions(curriculum).find((x) => x.value === answers.durasi);
      if (answers.paparan !== "internship")
        activities.push({
          id: "internship",
          title: "Magang",
          semester,
          detail: option?.detail ?? "Durasi belum dipilih.",
          fullSemester: answers.durasi === rules.internship.fullSemesterOption,
        });
      notes.push(rules.internship.note);
      if (answers.durasi === rules.internship.fullSemesterOption) blocked.add(semester);
    } else {
      if (answers.paparan !== "internship")
        activities.push({
          id: "internship",
          title: "Magang + Kerja Praktik",
          semester,
          detail: "Dalam semester. Durasi kalender mengikuti panduan dan persetujuan prodi.",
          fullSemester: answers.durasi === rules.internship.fullSemesterOption,
        });
      if (answers.durasi === rules.internship.fullSemesterOption) blocked.add(semester);
      notes.push(rules.internship.note);
    }
  } else if (rules.internship.noInternshipNote) {
    notes.push(rules.internship.noInternshipNote);
  }
  return { activities, blocked, notes };
}
