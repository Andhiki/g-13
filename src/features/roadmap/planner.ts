import source26 from "../../../output/data/ugm-ilkom-2026.json";
import { curricula, deriveRelations, type Course, type Relation } from "../../data";
import { assignedCoreSemester, creditsFor } from "../curriculum/course-utils";
import { type RoadmapSearch } from "./search";
import { internshipCodes, electiveOptions } from "./options";
import { planActivities } from "./activities";
import { scheduleCourses } from "./schedule";
import { findConflicts } from "./conflicts";

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
};
export type Roadmap = {
  courses: PlannedCourse[];
  activities: Activity[];
  relations: Relation[];
  requiredCredits: number;
  totalCredits: number;
  conflicts: string[];
  notes: string[];
};

export function buildRoadmap(answers: RoadmapSearch): Roadmap {
  const data = curricula[answers.kurikulum ?? "2026"];
  const courses: PlannedCourse[] = data.core
    .filter(
      (course) =>
        !course.id.startsWith("2021-slot") &&
        !course.placements.some((p) => p.label === "Pilihan agama"),
    )
    .map((course) => ({
      course,
      semester: assignedCoreSemester(course) ?? 1,
      kind: "required",
      originalId: course.id,
    }));
  if (data.id === "2021") {
    const religion = data.core.find((course) =>
      course.placements.some((p) => p.label === "Pilihan agama"),
    )!;
    const course = {
      ...religion,
      id: "roadmap-agama",
      code: "",
      title: "Agama sesuai keyakinan",
      englishTitle: "",
      placements: [{ ...religion.placements[0], label: "Pilih satu mata kuliah agama" }],
    };
    courses.push({ course, semester: 1, kind: "required", originalId: course.id });
  }
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
  if (data.id === "2026" && answers.magang === "ya" && answers.durasi) {
    const code = internshipCodes[answers.durasi];
    const course = data.all.find((x) => x.id === code);
    if (course) courses.push({ course, semester: 6, kind: "internship", originalId: course.id });
  }
  const preferred = new Set(
    source26.course_schedule.interest_area_rows
      .filter((row) => row.interest_area_raw === answers.minat)
      .map((row) => row.course_code_raw),
  );
  const candidates = electiveOptions(data.id).sort((a, b) => {
    const rank = (course: Course) =>
      data.id === "2026"
        ? Number(!preferred.has(course.id))
        : Number(!course.placements.some((p) => p.group === answers.minat));
    return (
      rank(a) - rank(b) ||
      Math.min(...a.placements.map((p) => p.semester ?? 5)) -
        Math.min(...b.placements.map((p) => p.semester ?? 5)) ||
      a.id.localeCompare(b.id)
    );
  });
  const relations = deriveRelations(data);
  let total = courses.reduce((sum, item) => sum + (creditsFor(item.course) ?? 0), 0);
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
    const replacement = answers.ganti?.[item.originalId];
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
  const { activities, blocked, notes } = planActivities(answers);
  scheduleCourses(courses, relations, answers, blocked);
  const plan: Roadmap = {
    courses,
    activities,
    relations,
    requiredCredits: courses
      .filter((x) => x.kind === "required")
      .reduce((sum, x) => sum + (creditsFor(x.course) ?? 0), 0),
    totalCredits: courses.reduce((sum, x) => sum + (creditsFor(x.course) ?? 0), 0),
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
