import source from "./source.json";
import syllabi from "./syllabi.json";
import { adaptCurriculum2026 } from "./normalize";
import type { CurriculumSlice } from "../../contracts/rules";

export const curriculum2026: CurriculumSlice = {
  curriculum: adaptCurriculum2026(source),
  syllabi,
  rules: {
    choiceDetail: "Enam peminatan, wajib minat, dan Kerja Praktik.",
    interestMode: "specialization",
    doubleDegreeWithoutInterest: true,
    excludedCoreIds: [],
    preferredElectives: Object.fromEntries(
      [
        ...new Set(source.course_schedule.interest_area_rows.map((row) => row.interest_area_raw)),
      ].map((interest) => [
        interest,
        source.course_schedule.interest_area_rows
          .filter((row) => row.interest_area_raw === interest)
          .map((row) => row.course_code_raw),
      ]),
    ),
    internship: {
      kind: "credited",
      options: [
        {
          value: "pendek",
          fullSemester: false,
          courseId: "PACS262608",
          label: "Durasi pendek",
          detail: "4 SKS Magang + 4 SKS Kerja Praktik.",
        },
        {
          value: "menengah",
          fullSemester: false,
          courseId: "PACS262606",
          label: "Durasi menengah",
          detail: "8 SKS Magang + 4 SKS Kerja Praktik.",
        },
        {
          value: "panjang",
          fullSemester: false,
          courseId: "PACS262607",
          label: "Durasi panjang",
          detail: "12 SKS Magang + 4 SKS Kerja Praktik.",
        },
        {
          value: "penuh",
          fullSemester: true,
          courseId: "PACS262609",
          label: "Satu semester penuh",
          detail: "16 SKS Magang + 4 SKS Kerja Praktik.",
        },
      ],
      note: "Tier SKS Magang 2026 mengikuti tabel sumber. Konversi durasi kalender harus dikonfirmasi melalui panduan Magang prodi.",
      noInternshipNote:
        "Kerja Praktik 4 SKS tetap wajib. Rencanakan antar semester setelah semester 5, dengan klaim SKS mengikuti semester penempatannya.",
    },
    exposure: {
      internshipDetail: "Hingga satu semester. Durasi dan pengakuan perlu dikonfirmasi.",
      doubleDegreeDetail: "1–4 semester di kampus mitra. Perlu rencana khusus.",
    },
    scheduling: {
      graduationIds: ["PACS262701", "PACS262702"],
      proposalId: "PACS262611",
      proposalAfterRequirements: true,
      practicalWorkId: "PACS262605",
      beforeDoubleDegree: [{ courseId: "PACS262412", semester: 5 }],
      overflowCourseIds: ["UNKU260014", "UNKU260015", "UNKU260011", "UNKU260016"],
      electiveSemesterStep: 1,
      communityService: null,
      starredPrerequisitesConcurrent: false,
    },
  },
};
