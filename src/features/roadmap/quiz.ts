import { duration2021, exposureOptions, interests, internshipTiers, type Choice } from "./options";
import type { RoadmapSearch } from "./search";

type AnswerKey = "kurikulum" | "minat" | "iup" | "paparan" | "magang" | "durasi";
export type Question = { key: AnswerKey; title: string; description: string; choices: Choice[] };
export function quizQuestions(answers: RoadmapSearch): Question[] {
  const curriculum = answers.kurikulum ?? "2026";
  const questions: Question[] = [
    {
      key: "kurikulum",
      title: "Kurikulum mana yang kamu ikuti?",
      description: "Rencana dimulai dari semester 1. Gunakan versi kurikulum yang berlaku untukmu.",
      choices: [
        {
          value: "2026",
          label: "2026",
          detail: "Enam peminatan, wajib minat, dan Kerja Praktik.",
        },
        {
          value: "2021",
          label: "2021",
          detail: "Revisi 2023. Pilihan dari empat laboratorium.",
        },
      ],
    },
    {
      key: "iup",
      title: "Kamu mahasiswa IUP?",
      description: "Mahasiswa kelas internasional perlu merencanakan international exposure.",
      choices: [
        {
          value: "ya",
          label: "IUP",
          detail: "Tambahkan kegiatan international exposure.",
        },
        {
          value: "tidak",
          label: "Reguler",
          detail: "Lanjut ke pilihan bidang yang kamu minati.",
        },
      ],
    },
  ];
  if (answers.iup === "ya")
    questions.push({
      key: "paparan",
      title: "Exposure apa yang kamu inginkan?",
      description: "Pilih rencana awal. Waktu kegiatan bisa kamu bandingkan di hasil.",
      choices: exposureOptions(curriculum),
    });
  const choices = interests(curriculum);
  if (curriculum === "2026" && answers.paparan === "double")
    choices.push({
      value: "tanpa-minat",
      label: "Tanpa peminatan",
      detail: "Sumber mengizinkan mahasiswa double degree tidak memilih minat.",
    });
  questions.push({
    key: "minat",
    title:
      curriculum === "2021" ? "Bidang apa yang kamu minati?" : "Peminatan mana yang kamu pilih?",
    description:
      curriculum === "2021"
        ? "Pilihan mengikuti laboratorium. Software dan data berada di satu kelompok RPLD."
        : "Pemilihan minat pada awal semester 4. Ini membantu menyusun rencana dari sekarang.",
    choices,
  });
  questions.push({
    key: "magang",
    title: "Mau mengambil Magang?",
    description:
      curriculum === "2026"
        ? "Magang bersifat pilihan. Kerja Praktik 4 SKS tetap wajib untuk semua mahasiswa."
        : "Magang dapat diakui melalui modul kegiatan. Konversi SKS perlu persetujuan prodi.",
    choices: [
      {
        value: "ya",
        label: "Ya",
        detail:
          answers.paparan === "internship"
            ? "Rencanakan sebagai kegiatan yang sama dengan Magang internasional."
            : "Tambahkan pengalaman kerja ke rencana kuliah.",
      },
      {
        value: "tidak",
        label: "Tidak",
        detail:
          curriculum === "2026"
            ? "Tetap ada Kerja Praktik antar semester."
            : "Isi kebutuhan SKS dengan mata kuliah pilihan.",
      },
    ],
  });
  if (answers.magang === "ya")
    questions.push({
      key: "durasi",
      title: "Seberapa lama rencana Magangmu?",
      description:
        curriculum === "2026"
          ? "Pilih tier beban Magang. Durasi kalender mengikuti panduan prodi, bukan konversi bulan otomatis."
          : "Ini preferensi durasi, bukan keputusan konversi SKS. Modul yang diakui ditentukan bersama prodi.",
      choices: curriculum === "2026" ? internshipTiers : duration2021,
    });
  return questions;
}
export function firstUnanswered(answers: RoadmapSearch) {
  return quizQuestions(answers).find(
    (question) => !question.choices.some((choice) => choice.value === answers[question.key]),
  );
}

export function answerQuestion(
  answers: RoadmapSearch,
  key: AnswerKey,
  value: string,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...answers, [key]: value, hasil: undefined };
  if (key === "kurikulum" && value !== answers.kurikulum) {
    next.minat = undefined;
    next.durasi = undefined;
    next.ganti = undefined;
  }
  if (key === "minat" && value !== answers.minat) next.ganti = undefined;
  return next;
}
