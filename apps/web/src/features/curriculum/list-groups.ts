import type { Course } from "@g13/curriculum";
import { assignedCoreSemester, isCore } from "./course-utils";

export type CourseSection = {
  id: string;
  title: string;
  courses: Course[];
  kind: "semester" | "unassigned" | "electives";
};

export function groupCoursesForList(courses: Course[]): CourseSection[] {
  const semesters = new Map<number, Course[]>();
  const unassigned: Course[] = [];
  const electives: Course[] = [];

  for (const course of courses) {
    if (!isCore(course)) {
      electives.push(course);
      continue;
    }
    const semester = assignedCoreSemester(course);
    if (semester === null) {
      unassigned.push(course);
      continue;
    }
    const group = semesters.get(semester) ?? [];
    group.push(course);
    semesters.set(semester, group);
  }

  const sections: CourseSection[] = [...semesters.entries()]
    .sort(([left], [right]) => left - right)
    .map(([semester, items]) => ({
      id: `semester-${semester}`,
      title: `Semester ${semester}`,
      courses: items,
      kind: "semester",
    }));

  if (unassigned.length) {
    sections.push({
      id: "unassigned",
      title: "Semester tidak dinyatakan",
      courses: unassigned,
      kind: "unassigned",
    });
  }
  if (electives.length) {
    sections.push({
      id: "electives",
      title: "Mata kuliah pilihan",
      courses: electives,
      kind: "electives",
    });
  }
  for (const section of sections) {
    section.courses.sort((left, right) => left.title.localeCompare(right.title, "id"));
  }
  return sections;
}
