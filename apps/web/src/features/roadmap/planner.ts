import {
  getCurriculum,
  getAcademicRules,
  getRelations,
  type Course,
  type Relation,
} from "@g13/curriculum";
import { assignedCoreSemester, creditsFor } from "../../courses/course-utils";
import { type PlanningInput } from "./planning-input";
import { electiveOptions } from "./options";
import { planActivities } from "./activities";
import { scheduleCourses } from "./schedule";
import { findConflicts, type Conflict } from "./conflicts";

export type PlannedCourse = {
  course: Course;
  semester: number;
  kind: "required" | "interest" | "elective" | "internship";
  originalId: string;
};
export type Activity = {
  id: string;
  title: string;
  semester: number;
  detail: string;
  fullSemester: boolean;
  recommendedCredits: number;
  endSemester: number;
};
export type Roadmap = {
  courses: PlannedCourse[];
  activities: Activity[];
  relations: Relation[];
  requiredCredits: number;
  totalCredits: number;
  conflicts: Conflict[];
  notes: string[];
};

export function buildRoadmap(answers: PlanningInput): Roadmap {
  const data = getCurriculum(answers.kurikulum);
  const rules = getAcademicRules(data.id);
  const courses: PlannedCourse[] = data.core
    .filter((course) => !rules.excludedCoreIds.includes(course.id))
    .map((course) => ({
      course,
      semester: assignedCoreSemester(course) ?? 1,
      kind: "required",
      originalId: course.id,
    }));
  for (const course of data.electives.filter((course) =>
    course.placements.some((p) => p.section === "interest" && p.group === answers.minat),
  )) {
    courses.push({
      course,
      semester: Math.min(...course.placements.map((p) => p.semester ?? 4)),
      kind: "interest",
      originalId: course.id,
    });
  }
  if (answers.internship.kind === "credited") {
    const course = answers.internship.course;
    courses.push({ course, semester: 6, kind: "internship", originalId: course.id });
  }
  const preferred = new Set(rules.preferredElectives[answers.minat] ?? []);
  const candidates = electiveOptions(data.id).sort((a, b) => {
    const rank = (course: Course) =>
      rules.interestMode === "specialization"
        ? Number(!preferred.has(course.id))
        : Number(!course.placements.some((p) => p.group === answers.minat));
    return (
      rank(a) - rank(b) ||
      Math.min(...a.placements.map((p) => p.semester ?? 5)) -
        Math.min(...b.placements.map((p) => p.semester ?? 5)) ||
      a.id.localeCompare(b.id)
    );
  });
  const relations = getRelations(data.id);
  const { activities, blocked, notes } = planActivities(answers);
  const activityCredits = activities.reduce(
    (sum, activity) => sum + activity.recommendedCredits,
    0,
  );
  let total =
    activityCredits + courses.reduce((sum, item) => sum + (creditsFor(item.course) ?? 0), 0);
  for (const course of candidates) {
    if (total >= data.totalCredits) break;
    if (courses.some((item) => item.course.id === course.id)) continue;
    if (
      relations.some(
        (r) => r.target === course.id && !courses.some((item) => item.course.id === r.source),
      )
    )
      continue;
    courses.push({
      course,
      semester: Math.min(...course.placements.map((p) => p.semester ?? 5)),
      kind: "elective",
      originalId: course.id,
    });
    total += creditsFor(course) ?? 0;
  }
  const used = new Set(courses.map((x) => x.course.id));
  for (const item of courses) {
    const replacement = answers.ganti[item.originalId];
    if (item.kind !== "elective" || !replacement || used.has(replacement)) continue;
    const course = electiveOptions(data.id).find((x) => x.id === replacement);
    if (
      !course ||
      course.placements.some((p) => p.section === "interest" && p.group === answers.minat)
    )
      continue;
    used.delete(item.course.id);
    used.add(course.id);
    item.course = course;
    item.semester = Math.min(...course.placements.map((p) => p.semester ?? 5));
  }
  scheduleCourses(courses, relations, answers, blocked, activities);
  const plan: Roadmap = {
    courses,
    activities,
    relations,
    requiredCredits: courses
      .filter((x) => x.kind === "required")
      .reduce((sum, x) => sum + (creditsFor(x.course) ?? 0), 0),
    totalCredits:
      activityCredits + courses.reduce((sum, x) => sum + (creditsFor(x.course) ?? 0), 0),
    conflicts: [],
    notes: [
      "Rencana dari semester 1, dengan asumsi mata kuliah selesai sesuai urutan. Batas perencanaan 24 SKS memerlukan hak SKS sesuai IP. Penawaran aktual, nilai, aturan KKN, dan persetujuan dosen belum diverifikasi.",
      ...notes,
      ...data.readingNotes,
    ],
  };
  plan.conflicts = findConflicts(plan, answers, blocked);
  return plan;
}
