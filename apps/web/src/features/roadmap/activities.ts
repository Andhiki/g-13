import { getAcademicRules } from "@g13/curriculum";
import type { Activity } from "./planner";
import type { PlanningInput } from "./planning-input";

export function planActivities(answers: PlanningInput) {
  const activities: Activity[] = [];
  const blocked = new Set<number>();
  const notes: string[] = [];
  const curriculum = answers.kurikulum;
  const rules = getAcademicRules(curriculum);
  if (answers.exposure.kind !== "none") {
    const option = answers.exposure.option;
    const fullSemester = ["exchange", "internship", "double"].includes(answers.exposure.kind);
    const semester = answers.exposure.kind === "double" ? 5 : answers.semesterPaparan;
    activities.push({
      id: "exposure",
      title: option.label,
      semester,
      detail: option.detail,
      fullSemester,
      endSemester: answers.exposure.kind === "double" ? 8 : semester,
    });
    if (answers.exposure.kind === "double") {
      for (let term = 5; term <= 8; term++) blocked.add(term);
      notes.push(
        "Double degree memerlukan rencana kampus mitra. Rentang semester 5–8 dicadangkan sementara; durasi sebenarnya dan penyetaraan belum ditentukan.",
      );
    } else if (fullSemester) blocked.add(semester);
    if (answers.exposure.kind === "undecided")
      notes.push("International exposure belum dipilih. Kewajiban IUP ini belum terselesaikan.");
    else
      notes.push(
        "Bukti international exposure dan penyetaraan mata kuliah perlu persetujuan prodi. Tidak ada SKS kampus mitra yang dihitung otomatis.",
      );
    if (answers.exposure.kind === "internship")
      notes.push(
        "Satu kegiatan Magang internasional dapat memenuhi exposure. Konversi SKS Magang tetap memerlukan persetujuan; tidak dihitung dua kali.",
      );
  }
  if (answers.internship.kind !== "none") {
    const semester = answers.exposure.kind === "internship" ? answers.semesterPaparan : 6;
    const { option } = answers.internship;
    if (answers.exposure.kind !== "internship") {
      activities.push({
        id: "internship",
        title: answers.internship.kind === "activity" ? "Magang" : "Magang + Kerja Praktik",
        semester,
        endSemester: semester,
        detail:
          answers.internship.kind === "activity"
            ? option.detail
            : "Dalam semester. Durasi kalender mengikuti panduan dan persetujuan prodi.",
        fullSemester: option.fullSemester,
      });
    }
    if (option.fullSemester) blocked.add(semester);
    notes.push(rules.internship.note);
  } else if (rules.internship.noInternshipNote) {
    notes.push(rules.internship.noInternshipNote);
  }
  return { activities, blocked, notes };
}
