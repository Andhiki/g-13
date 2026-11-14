type Course = { id: string; code: string; nameId: string; nameEn: string };
type Professor = { name: string; reviews: { courseId: string }[] };

export function searchProfessors<T extends Professor>(
  professors: T[],
  courses: Course[],
  query: string,
): T[] {
  const words = query
    .toLocaleLowerCase()
    .replace(/\bmata\s+kuliah\b/gu, " ")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word && !["di", "pada", "in"].includes(word));
  if (!words.length) return professors;
  return professors.flatMap((professor) => {
    const name = professor.name.toLocaleLowerCase();
    const courseWords = words.filter((word) => !name.includes(word));
    if (!courseWords.length) return [professor];
    const matchingIds = new Set(
      courses
        .filter((course) => {
          const searchable = `${course.code} ${course.nameId} ${course.nameEn}`.toLocaleLowerCase();
          return courseWords.every((word) => searchable.includes(word));
        })
        .map((course) => course.id),
    );
    const reviews = professor.reviews.filter((review) => matchingIds.has(review.courseId));
    return reviews.length ? [{ ...professor, reviews }] : [];
  });
}
