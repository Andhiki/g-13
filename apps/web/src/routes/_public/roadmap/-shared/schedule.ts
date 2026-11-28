import { getAcademicRules, type Relation } from "@g13/curriculum";
import { creditsFor } from "@/courses/course-utils";
import type { Activity, PlannedCourse } from "./planner";
import type { PlanningInput } from "./planning-input";

export const planningLimit = 24;
export const lastPlanningSemester = 8;

/** Total planned credits for one semester, combining courses and recommended activity credits. */
export function semesterCredits(
  term: number,
  courses: readonly PlannedCourse[],
  activities: readonly Activity[] = [],
): number {
  return (
    activities
      .filter((activity) => activity.semester === term)
      .reduce((sum, activity) => sum + activity.recommendedCredits, 0) +
    courses
      .filter((item) => item.semester === term)
      .reduce((sum, item) => sum + (creditsFor(item.course) ?? 0), 0)
  );
}

/** Total planned credits across all courses and activities in a roadmap. */
export function totalRoadmapCredits(
  courses: readonly PlannedCourse[],
  activities: readonly Activity[] = [],
): number {
  return (
    activities.reduce((sum, activity) => sum + activity.recommendedCredits, 0) +
    courses.reduce((sum, item) => sum + (creditsFor(item.course) ?? 0), 0)
  );
}

export function scheduleCourses(
  courses: readonly PlannedCourse[],
  relations: Relation[],
  answers: PlanningInput,
  blocked: Set<number>,
  activities: readonly Activity[] = [],
): PlannedCourse[] {
  const scheduled = courses.map((item) => ({ ...item }));
  const rules = getAcademicRules(answers.kurikulum).scheduling;
  const endIds = rules.graduationIds;
  const proposalId = rules.proposalId;
  const internshipSemester = answers.exposure.kind === "internship" ? answers.semesterPaparan : 6;
  for (const item of scheduled) {
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
  const fixedCourses = scheduled.filter((x) => x.kind === "required" || x.kind === "internship");
  if (semesterCredits(6, fixedCourses) > planningLimit) {
    const kknIds = rules.overflowCourseIds;
    for (const item of scheduled.filter((x) => kknIds.includes(x.course.id) && x.semester === 6)) {
      item.semester = 7;
      while (item.semester < lastPlanningSemester && blocked.has(item.semester)) item.semester++;
    }
  }
  const placed = scheduled.filter((x) => x.kind === "required" || x.kind === "internship");
  // shortcut: source guidance and resolved course links only; use an academic rules engine when complete offering and equivalency data exist.
  for (const item of scheduled.filter((x) => x.kind === "interest" || x.kind === "elective")) {
    const prereqs = relations
      .filter((r) => r.target === item.course.id)
      .flatMap((r) => {
        const course = scheduled.find((x) => x.course.id === r.source);
        return course ? [{ course, timing: r.timing }] : [];
      });
    let term = item.semester;
    while (
      term + rules.electiveSemesterStep <= lastPlanningSemester &&
      (blocked.has(term) ||
        semesterCredits(term, placed, activities) + (creditsFor(item.course) ?? 0) >
          planningLimit ||
        prereqs.some(({ course, timing }) =>
          timing === "concurrent" ? course.semester > term : course.semester >= term,
        ))
    )
      term += rules.electiveSemesterStep;
    item.semester = Math.min(term, lastPlanningSemester);
    placed.push(item);
  }
  const proposal = scheduled.find((x) => x.course.id === proposalId);
  if (proposal && rules.proposalAfterRequirements) {
    const requirements = scheduled.filter(
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
    for (const item of scheduled.filter((x) => endIds.includes(x.course.id)))
      item.semester = Math.min(
        lastPlanningSemester,
        Math.max(item.semester, proposal.semester + 1),
      );
  }
  for (const item of scheduled.filter((x) => endIds.includes(x.course.id))) {
    while (item.semester < lastPlanningSemester && blocked.has(item.semester)) item.semester++;
  }
  return scheduled;
}
