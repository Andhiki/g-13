import source from "./source.json";
import syllabi from "./syllabi.json";
import { adaptCurriculum2021 } from "./normalize";
import type { CurriculumSlice } from "../../contracts/rules";

const curriculum = adaptCurriculum2021(source);

export const curriculum2021: CurriculumSlice = {
  curriculum,
  syllabi,
  rules: {
    choiceDetail: "Revisi 2023. Pilihan dari empat laboratorium.",
    interestMode: "laboratory",
    doubleDegreeWithoutInterest: false,
    excludedCoreIds: curriculum.core
      .filter((course) => course.id.startsWith("2021-slot"))
      .map((course) => course.id),
    religionChoiceIds: curriculum.core
      .filter((course) => course.placements.some((p) => p.label === "Pilihan agama"))
      .map((course) => course.id),
    preferredElectives: {},
    internship: {
      kind: "activity",
      options: [
        {
          value: "singkat",
          label: "Kurang dari satu semester",
          detail: "Durasi rencana. Konversi SKS perlu persetujuan prodi.",
        },
        {
          value: "semester",
          label: "Satu semester",
          detail: "Semester 6 disiapkan untuk Magang. Konversi SKS belum ditentukan.",
        },
      ],
      courseIds: {},
      fullSemesterOption: "semester",
      note: "Konversi durasi Magang 2021 ke modul dan SKS belum terverifikasi. Kegiatan ini belum menambah SKS pilihan.",
      noInternshipNote: null,
    },
    exposure: {
      internshipDetail: "Durasi bergantung program. Sumber memuat beberapa skema.",
      doubleDegreeDetail: "3–4 semester di kampus mitra. Perlu rencana khusus.",
    },
    scheduling: {
      graduationIds: ["MII21-4003", "MII21-4002"],
      proposalId: "MII21-4001",
      proposalAfterRequirements: false,
      practicalWorkId: null,
      beforeDoubleDegree: [],
      overflowCourseIds: [],
      electiveSemesterStep: 2,
      communityService: {
        courseId: "UNU22-2001",
        companionIds: ["UNU22-2001", "UNU22-2002", "UNU22-2004"],
      },
      starredPrerequisitesConcurrent: true,
    },
  },
};
