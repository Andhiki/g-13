export type ExpectedDecision = "clear" | "flag";

export type SyntheticModerationCase = {
  id: string;
  language: "id" | "en" | "mixed";
  focus: string[];
  review: { text: string; expected: ExpectedDecision };
  chosenName: { text: string; expected: ExpectedDecision } | null;
};

// Synthetic held-out examples. These examples are deliberately separate from the
// few-shot examples in the evaluator prompt and contain no real student data.
export const syntheticModerationCases: SyntheticModerationCase[] = [
  {
    id: "id-wordless-attack",
    language: "id",
    focus: ["wordless-personal-attack"],
    review: {
      text: "Anda sengaja menipu mahasiswa dan tidak pantas mengajar.",
      expected: "flag",
    },
    chosenName: { text: "Mahasiswa Satu", expected: "clear" },
  },
  {
    id: "en-wordless-attack",
    language: "en",
    focus: ["wordless-personal-attack"],
    review: {
      text: "You are a liar and a disgrace to the department.",
      expected: "flag",
    },
    chosenName: { text: "CourseReviewer", expected: "clear" },
  },
  {
    id: "mixed-wordless-attack",
    language: "mixed",
    focus: ["wordless-personal-attack"],
    review: {
      text: "Kamu dosen paling useless; students deserve better than this.",
      expected: "flag",
    },
    chosenName: { text: "Review Kampus", expected: "clear" },
  },
  {
    id: "id-typo-insult",
    language: "id",
    focus: ["typo"],
    review: {
      text: "Penjelasan materinya goblokk banget.",
      expected: "flag",
    },
    chosenName: { text: "Rina", expected: "clear" },
  },
  {
    id: "id-abbreviated-insult",
    language: "id",
    focus: ["abbreviation"],
    review: { text: "Pak ini gblk, tidak membantu.", expected: "flag" },
    chosenName: { text: "Bngst", expected: "flag" },
  },
  {
    id: "id-academic-literal-term",
    language: "id",
    focus: ["academic-literal-use"],
    review: {
      text: "Dalam kajian bahasa, kata 'anjing' dianalisis sebagai leksem dalam konteks umpatan.",
      expected: "clear",
    },
    chosenName: { text: "Peneliti Bahasa", expected: "clear" },
  },
  {
    id: "en-academic-literal-term",
    language: "en",
    focus: ["academic-literal-use"],
    review: {
      text: "The word 'fuck' is quoted as an example in a study of taboo vocabulary.",
      expected: "clear",
    },
    chosenName: null,
  },
  {
    id: "id-reported-personal-attack",
    language: "id",
    focus: ["reported-speech", "personal-attack"],
    review: {
      text: "Dosen itu berkata, 'kamu tidak berguna'; komentar tersebut membuat saya malu.",
      expected: "flag",
    },
    chosenName: null,
  },
  {
    id: "mixed-reported-neutral-criticism",
    language: "mixed",
    focus: ["reported-speech", "ordinary-criticism"],
    review: {
      text: "Saya mengutip komentar teman, 'materi ini sulit', lalu kami bahas konsepnya.",
      expected: "clear",
    },
    chosenName: { text: "Study Notes", expected: "clear" },
  },
  {
    id: "id-ordinary-criticism",
    language: "id",
    focus: ["ordinary-criticism"],
    review: {
      text: "Materi tersusun rapi, tetapi tempo terlalu cepat dan contoh latihan masih kurang.",
      expected: "clear",
    },
    chosenName: null,
  },
  {
    id: "en-ordinary-criticism",
    language: "en",
    focus: ["ordinary-criticism"],
    review: {
      text: "The grading felt inconsistent and lectures were hard to follow.",
      expected: "clear",
    },
    chosenName: { text: "Student Reviewer", expected: "clear" },
  },
];
