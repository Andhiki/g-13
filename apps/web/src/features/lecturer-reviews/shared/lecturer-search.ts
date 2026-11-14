type Course = { id: string; code: string; nameId: string; nameEn: string };
type Lecturer = { name: string; courses: { courseId: string }[] };

export function searchLecturers<T extends Lecturer>(
  lecturers: T[],
  courses: Course[],
  query: string,
): T[] {
  const words = query
    .toLocaleLowerCase()
    .replace(/\bmata\s+kuliah\b/gu, " ")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word && !["di", "pada", "in"].includes(word));
  if (!words.length) return lecturers;
  return lecturers.flatMap((lecturer) => {
    const name = lecturer.name.toLocaleLowerCase();
    const courseWords = words.filter((word) => !name.includes(word));
    if (!courseWords.length) return [lecturer];
    const matchingIds = new Set(
      courses
        .filter((course) => {
          const searchable = `${course.code} ${course.nameId} ${course.nameEn}`.toLocaleLowerCase();
          return courseWords.every((word) => searchable.includes(word));
        })
        .map((course) => course.id),
    );
    const matchingCourses = lecturer.courses.filter((course) => matchingIds.has(course.courseId));
    return matchingCourses.length ? [{ ...lecturer, courses: matchingCourses }] : [];
  });
}
