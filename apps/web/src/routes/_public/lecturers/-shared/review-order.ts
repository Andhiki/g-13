export const lecturerOrders = [
  "name",
  "name-desc",
  "reviews",
  "reviews-asc",
  "rating",
  "rating-asc",
] as const;
export type LecturerOrder = (typeof lecturerOrders)[number];
export const reviewOrders = ["newest", "oldest", "highest", "lowest"] as const;
export type ReviewOrder = (typeof reviewOrders)[number];
export const defaultReviewOrder = "newest" satisfies ReviewOrder;

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
