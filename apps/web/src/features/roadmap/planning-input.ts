import {
  getAcademicRules,
  getCourse,
  type AcademicOption,
  type Course,
  type CurriculumId,
} from "@g13/curriculum";
import { exposureOptions, interests, type Exposure } from "./options";
import type { RoadmapSearch } from "./search";

type InternshipOption = AcademicOption & { fullSemester: boolean };
export type PlanningInput = {
  kurikulum: CurriculumId;
  minat: string;
  lulus: 7 | 8;
  semesterPaparan: 6 | 7;
  ganti: Record<string, string>;
  exposure: { kind: "none" } | { kind: Exposure; option: AcademicOption };
  internship:
    | { kind: "none" }
    | { kind: "activity"; option: InternshipOption }
    | { kind: "credited"; option: InternshipOption; course: Course };
};

export function planningInput(answers: RoadmapSearch): PlanningInput | null {
  if (!answers.kurikulum || !answers.minat || !answers.iup || !answers.magang) return null;
  const rules = getAcademicRules(answers.kurikulum);
  const exposureOption = exposureOptions(answers.kurikulum).find(
    (option) => option.value === answers.paparan,
  );
  let exposure: PlanningInput["exposure"] = { kind: "none" };
  if (answers.iup === "ya") {
    if (!exposureOption) return null;
    exposure = { kind: exposureOption.value, option: exposureOption };
  }
  if (
    !interests(answers.kurikulum).some((option) => option.value === answers.minat) &&
    !(
      exposure.kind === "double" &&
      rules.doubleDegreeWithoutInterest &&
      answers.minat === "tanpa-minat"
    )
  )
    return null;
  let internship: PlanningInput["internship"] = { kind: "none" };
  if (answers.magang === "ya") {
    if (rules.internship.kind === "credited") {
      const option = rules.internship.options.find((option) => option.value === answers.durasi);
      if (!option) return null;
      const course = getCourse(answers.kurikulum, option.courseId);
      if (!course) return null;
      internship = { kind: "credited", option, course };
    } else {
      const option = rules.internship.options.find((option) => option.value === answers.durasi);
      if (!option) return null;
      internship = { kind: "activity", option };
    }
  }
  return {
    kurikulum: answers.kurikulum,
    minat: answers.minat,
    lulus: answers.lulus,
    semesterPaparan: answers.semesterPaparan,
    ganti: Object.fromEntries(
      Object.entries(answers.ganti ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    ),
    exposure,
    internship,
  };
}
