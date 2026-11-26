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
  return [...lecturers].sort((a, b) => {
    const byName = a.name.localeCompare(b.name, "id", { sensitivity: "base" });
    const byId = a.id.localeCompare(b.id);
    const tieBreak = byName || byId;
    switch (lecturerOrder) {
      case "name-desc":
        return -byName || byId;
      case "reviews":
        return b.reviewCount - a.reviewCount || tieBreak;
      case "reviews-asc":
        return a.reviewCount - b.reviewCount || tieBreak;
      case "rating":
      case "rating-asc":
        if (a.overallAverage === null || b.overallAverage === null) {
          return Number(b.overallAverage !== null) - Number(a.overallAverage !== null) || tieBreak;
        }
        return (
          (lecturerOrder === "rating"
            ? b.overallAverage - a.overallAverage
            : a.overallAverage - b.overallAverage) || tieBreak
        );
      default:
        return tieBreak;
    }
  });
}
