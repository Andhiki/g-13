import { exposureOptions, duration2021 } from "./options";
import type { Activity } from "./planner";
import type { RoadmapSearch } from "./search";

export function planActivities(answers: RoadmapSearch) {
  const activities: Activity[] = [];
  const blocked = new Set<number>();
  const notes: string[] = [];
  const curriculum = answers.kurikulum ?? "2026";
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
    if (curriculum === "2021") {
      const option = duration2021.find((x) => x.value === answers.durasi);
      if (answers.paparan !== "internship")
        activities.push({
          id: "internship",
          title: "Magang",
          semester,
          detail: option?.detail ?? "Durasi belum dipilih.",
          fullSemester: answers.durasi === "semester",
        });
      notes.push(
        "Konversi durasi Magang 2021 ke modul dan SKS belum terverifikasi. Kegiatan ini belum menambah SKS pilihan.",
      );
      if (answers.durasi === "semester") blocked.add(semester);
    } else {
      if (answers.paparan !== "internship")
        activities.push({
          id: "internship",
          title: "Magang + Kerja Praktik",
          semester,
          detail: "Dalam semester. Durasi kalender mengikuti panduan dan persetujuan prodi.",
          fullSemester: answers.durasi === "penuh",
        });
      if (answers.durasi === "penuh") blocked.add(semester);
      notes.push(
        "Tier SKS Magang 2026 mengikuti tabel sumber. Konversi durasi kalender harus dikonfirmasi melalui panduan Magang prodi.",
      );
    }
  } else if (curriculum === "2026") {
    notes.push(
      "Kerja Praktik 4 SKS tetap wajib. Rencanakan antar semester setelah semester 5, dengan klaim SKS mengikuti semester penempatannya.",
    );
  }
  return { activities, blocked, notes };
}
