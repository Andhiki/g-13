import { getAcademicRules, listCurricula, defaultCurriculumId } from "@g13/curriculum";
import { internshipOptions, exposureOptions, interests, type Choice } from "./options";
import type { RoadmapSearch } from "./search";

type AnswerKey = "kurikulum" | "minat" | "iup" | "paparan" | "magang" | "durasi";
export type Question = { key: AnswerKey; title: string; description: string; choices: Choice[] };
export function quizQuestions(answers: RoadmapSearch): Question[] {
  const curriculum = answers.kurikulum ?? defaultCurriculumId;
  const rules = getAcademicRules(curriculum);
  const questions: Question[] = [
    {
      key: "kurikulum",
      title: "Kurikulum mana yang kamu ikuti?",
      description: "Rencana dimulai dari semester 1. Gunakan versi kurikulum yang berlaku untukmu.",
      choices: listCurricula()
        .reverse()
        .map((item) => ({
          value: item.id,
          label: item.id,
          detail: getAcademicRules(item.id).choiceDetail,
        })),
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
  if (rules.doubleDegreeWithoutInterest && answers.paparan === "double")
    choices.push({
      value: "tanpa-minat",
      label: "Tanpa peminatan",
      detail: "Sumber mengizinkan mahasiswa double degree tidak memilih minat.",
    });
  questions.push({
    key: "minat",
    title:
      rules.interestMode === "laboratory"
        ? "Bidang apa yang kamu minati?"
        : "Peminatan mana yang kamu pilih?",
    description:
      rules.interestMode === "laboratory"
        ? "Pilihan mengikuti laboratorium. Software dan data berada di satu kelompok RPLD."
        : "Pemilihan minat pada awal semester 4. Ini membantu menyusun rencana dari sekarang.",
    choices,
  });
  questions.push({
    key: "magang",
    title: "Mau mengambil Magang?",
    description:
      rules.internship.kind === "credited"
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
          rules.internship.kind === "credited"
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
        rules.internship.kind === "credited"
          ? "Pilih tier beban Magang. Durasi kalender mengikuti panduan prodi, bukan konversi bulan otomatis."
          : "Ini preferensi durasi, bukan keputusan konversi SKS. Modul yang diakui ditentukan bersama prodi.",
      choices: internshipOptions(curriculum),
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
