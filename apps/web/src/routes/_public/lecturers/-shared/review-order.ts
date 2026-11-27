export const lecturerOrders = [
  "name",
  "name-desc",
  "reviews",
  "reviews-asc",
  "rating",
  "rating-asc",
] as const;
export type LecturerOrder = (typeof lecturerOrders)[number];
export type ReviewOrder = "newest" | "oldest" | "highest" | "lowest";
type Review = { id: string; courseId: string; overall: number; createdAt: Date };

export function filterReviewsByCourse<T extends { courseId: string }>(
  reviews: T[],
  courseId: string | null,
): T[] {
  return courseId === null ? reviews : reviews.filter((review) => review.courseId === courseId);
}

export function orderReviews<T extends Review>(reviews: T[], order: ReviewOrder): T[] {
  return [...reviews].sort((a, b) => {
    const newest = b.createdAt.getTime() - a.createdAt.getTime();
    if (order === "highest") return b.overall - a.overall || newest || a.id.localeCompare(b.id);
    if (order === "lowest") return a.overall - b.overall || newest || a.id.localeCompare(b.id);
    return (order === "oldest" ? -newest : newest) || a.id.localeCompare(b.id);
  });
}

export function orderLecturers<
  T extends { id: string; name: string; reviewCount: number; overallAverage: number | null },
>(lecturers: T[], lecturerOrder: LecturerOrder): T[] {
  return [...lecturers].sort((leftLecturer, rightLecturer) => {
    const nameComparison = leftLecturer.name.localeCompare(rightLecturer.name, "id", {
      sensitivity: "base",
    });
    const idComparison = leftLecturer.id.localeCompare(rightLecturer.id);
    const nameThenIdComparison = nameComparison || idComparison;
    switch (lecturerOrder) {
      case "name-desc":
        return -nameComparison || idComparison;
      case "reviews":
        return rightLecturer.reviewCount - leftLecturer.reviewCount || nameThenIdComparison;
      case "reviews-asc":
        return leftLecturer.reviewCount - rightLecturer.reviewCount || nameThenIdComparison;
      case "rating":
      case "rating-asc":
        if (leftLecturer.overallAverage === null || rightLecturer.overallAverage === null) {
          return (
            Number(rightLecturer.overallAverage !== null) -
              Number(leftLecturer.overallAverage !== null) || nameThenIdComparison
          );
        }
        return (
          (lecturerOrder === "rating"
            ? rightLecturer.overallAverage - leftLecturer.overallAverage
            : leftLecturer.overallAverage - rightLecturer.overallAverage) || nameThenIdComparison
        );
      default:
        return nameThenIdComparison;
    }
  });
}
