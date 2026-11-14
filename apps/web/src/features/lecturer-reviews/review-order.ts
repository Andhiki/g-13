export type LecturerOrder = "name" | "review-count" | "rating";
export type ReviewOrder = "newest" | "oldest" | "highest" | "lowest";
type Review = { id: string; courseId: string; overall: number; createdAt: Date };

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
    const byName =
      a.name.localeCompare(b.name, "id", { sensitivity: "base" }) || a.id.localeCompare(b.id);
    if (lecturerOrder === "review-count") return b.reviewCount - a.reviewCount || byName;
    if (lecturerOrder === "rating") {
      if (a.overallAverage === null || b.overallAverage === null)
        return Number(b.overallAverage !== null) - Number(a.overallAverage !== null) || byName;
      return b.overallAverage - a.overallAverage || byName;
    }
    return byName;
  });
}
