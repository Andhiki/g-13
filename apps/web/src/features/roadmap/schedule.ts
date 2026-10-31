import { getAcademicRules, type Relation } from "@g13/curriculum";
import { creditsFor } from "../../courses/course-utils";
import type { Activity, PlannedCourse } from "./planner";
import type { PlanningInput } from "./planning-input";

export const planningLimit = 24;
export const lastPlanningSemester = 8;

export function scheduleCourses(
  courses: PlannedCourse[],
  relations: Relation[],
  answers: PlanningInput,
  blocked: Set<number>,
  activities: Activity[] = [],
) {
  const rules = getAcademicRules(answers.kurikulum).scheduling;
  const endIds = rules.graduationIds;
  const proposalId = rules.proposalId;
  const internshipSemester = answers.exposure.kind === "internship" ? answers.semesterPaparan : 6;
  for (const item of courses) {
    const early = rules.beforeDoubleDegree.find((rule) => rule.courseId === item.course.id);
    if (early && answers.exposure.kind !== "double") item.semester = early.semester;
    if (endIds.includes(item.course.id)) item.semester = answers.lulus;
    if (item.course.id === proposalId && rules.proposalAfterRequirements)
      item.semester = answers.lulus - 1;
    if (item.kind === "internship" || item.course.id === rules.practicalWorkId)
      item.semester = answers.internship.kind !== "none" ? internshipSemester : 6;
    if (
      item.kind === "required" &&
      !endIds.includes(item.course.id) &&
      !(item.course.id === rules.practicalWorkId && answers.internship.kind !== "none")
    ) {
      while (item.semester < lastPlanningSemester && blocked.has(item.semester)) item.semester++;
    }
  }
  const fixedSixthTermCredits = courses
    .filter((x) => x.semester === 6 && (x.kind === "required" || x.kind === "internship"))
    .reduce((sum, x) => sum + (creditsFor(x.course) ?? 0), 0);
  if (fixedSixthTermCredits > planningLimit) {
    const kknIds = rules.overflowCourseIds;
    for (const item of courses.filter((x) => kknIds.includes(x.course.id) && x.semester === 6)) {
      item.semester = 7;
      while (item.semester < lastPlanningSemester && blocked.has(item.semester)) item.semester++;
    }
  }
  const placed = courses.filter((x) => x.kind === "required" || x.kind === "internship");
  const load = (term: number) =>
    activities
      .filter((activity) => activity.semester === term)
      .reduce((sum, activity) => sum + activity.recommendedCredits, 0) +
    placed
      .filter((x) => x.semester === term)
      .reduce((sum, x) => sum + (creditsFor(x.course) ?? 0), 0);
  // shortcut: source guidance and resolved course links only; use an academic rules engine when complete offering and equivalency data exist.
  for (const item of courses.filter((x) => x.kind === "interest" || x.kind === "elective")) {
    const prereqs = relations
      .filter((r) => r.target === item.course.id)
      .flatMap((r) => {
        const course = courses.find((x) => x.course.id === r.source);
        return course ? [{ course, timing: r.timing }] : [];
      });
    let term = item.semester;
    while (
      term + rules.electiveSemesterStep <= lastPlanningSemester &&
      (blocked.has(term) ||
        load(term) + (creditsFor(item.course) ?? 0) > planningLimit ||
        prereqs.some(({ course, timing }) =>
          timing === "concurrent" ? course.semester > term : course.semester >= term,
        ))
    )
      term += rules.electiveSemesterStep;
    item.semester = Math.min(term, lastPlanningSemester);
    placed.push(item);
  }
  const proposal = courses.find((x) => x.course.id === proposalId);
  if (proposal && rules.proposalAfterRequirements) {
    const requirements = courses.filter(
      (x) =>
        (x.kind === "required" || x.kind === "interest") &&
        !endIds.includes(x.course.id) &&
        x !== proposal,
    );
    proposal.semester = Math.min(
      lastPlanningSemester - 1,
      Math.max(proposal.semester, ...requirements.map((x) => x.semester)),
    );
    while (proposal.semester < lastPlanningSemester - 1 && blocked.has(proposal.semester))
      proposal.semester++;
    for (const item of courses.filter((x) => endIds.includes(x.course.id)))
      item.semester = Math.min(
        lastPlanningSemester,
        Math.max(item.semester, proposal.semester + 1),
      );
  }
  for (const item of courses.filter((x) => endIds.includes(x.course.id))) {
    while (item.semester < lastPlanningSemester && blocked.has(item.semester)) item.semester++;
  }
}
