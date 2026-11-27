export type LecturerOrder = "name" | "review-count" | "rating";
export const reviewOrders = ["newest", "oldest", "highest", "lowest"] as const;
export type ReviewOrder = (typeof reviewOrders)[number];
export const defaultReviewOrder = "newest" satisfies ReviewOrder;

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
