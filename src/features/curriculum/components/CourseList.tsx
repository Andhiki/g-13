import { useMemo } from "react";
import type { Course } from "../../../data";
import { groupCoursesForList } from "../list-groups";
import { CourseTable } from "./CourseTable";

export function CourseList({
  courses,
  selectedId,
  select,
}: {
  courses: Course[];
  selectedId: string | null;
  select: (id: string) => void;
}) {
  const sections = useMemo(() => groupCoursesForList(courses), [courses]);

  if (!sections.length) {
    return (
      <p className="p-4 text-paragraph-sm text-text-sub-600" role="status">
        Tidak ada mata kuliah pada filter ini.
      </p>
    );
  }

  return (
    <div className="space-y-8" aria-label="Daftar mata kuliah">
      {sections.map((section) => (
        <CourseTable key={section.id} section={section} selectedId={selectedId} select={select} />
      ))}
    </div>
  );
}
