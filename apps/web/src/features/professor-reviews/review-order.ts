export type ProfessorOrder = "name" | "review-count" | "rating";
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

export function orderProfessors<T extends { id: string; name: string; reviews: Review[] }>(
  professors: T[],
  courseId: string | null,
  professorOrder: ProfessorOrder,
  reviewOrder: ReviewOrder,
): T[] {
  const average = (reviews: Review[]) =>
    reviews.reduce((total, review) => total + review.overall, 0) / reviews.length;
  return professors
    .map((professor) => ({
      ...professor,
      reviews: orderReviews(
        professor.reviews.filter((review) => !courseId || review.courseId === courseId),
        reviewOrder,
      ),
    }))
    .sort((a, b) => {
      const byName =
        a.name.localeCompare(b.name, "id", { sensitivity: "base" }) || a.id.localeCompare(b.id);
      if (professorOrder === "review-count") return b.reviews.length - a.reviews.length || byName;
      if (professorOrder === "rating") {
        if (!a.reviews.length || !b.reviews.length)
          return Number(Boolean(b.reviews.length)) - Number(Boolean(a.reviews.length)) || byName;
        return average(b.reviews) - average(a.reviews) || byName;
      }
      return byName;
    });
}
