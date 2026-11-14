import { asc, eq, and, isNull, sql } from "drizzle-orm";
import { courses, professors, reviews } from "@g13/db";
import type { createDatabase } from "@g13/db";

type Database = ReturnType<typeof createDatabase>;
const visibleReview = and(eq(reviews.status, "published"), isNull(reviews.deletedAt));

export async function getPublicProfessorReviews(db: Database) {
  const courseRows = await db
    .select({ id: courses.id, code: courses.code, nameId: courses.nameId, nameEn: courses.nameEn })
    .from(courses)
    .orderBy(asc(courses.code));

  const professorRows = await db
    .select({
      id: professors.id,
      name: professors.name,
      reviewCount: sql<number>`count(${reviews.id})`,
      overallAverage: sql<
        number | null
      >`avg((${reviews.clarity} + ${reviews.support} + ${reviews.organization}) / 3.0)`,
      clarityAverage: sql<number | null>`avg(${reviews.clarity})`,
      supportAverage: sql<number | null>`avg(${reviews.support})`,
      organizationAverage: sql<number | null>`avg(${reviews.organization})`,
    })
    .from(professors)
    .leftJoin(reviews, and(eq(reviews.professorId, professors.id), visibleReview))
    .groupBy(professors.id)
    .orderBy(asc(professors.name));

  const reviewRows = await db
    .select({
      id: reviews.id,
      professorId: reviews.professorId,
      courseId: courses.id,
      code: courses.code,
      nameId: courses.nameId,
      nameEn: courses.nameEn,
      termLabel: reviews.termLabel,
      authorName: reviews.authorName,
      clarity: reviews.clarity,
      support: reviews.support,
      organization: reviews.organization,
      overall: sql<number>`(${reviews.clarity} + ${reviews.support} + ${reviews.organization}) / 3.0`,
      body: reviews.body,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(courses, eq(courses.id, reviews.courseId))
    .where(visibleReview)
    .orderBy(asc(reviews.createdAt));

  return {
    courses: courseRows,
    professors: professorRows.map((professor) => ({
      ...professor,
      reviewCount: Number(professor.reviewCount),
      overallAverage: professor.overallAverage === null ? null : Number(professor.overallAverage),
      clarityAverage: professor.clarityAverage === null ? null : Number(professor.clarityAverage),
      supportAverage: professor.supportAverage === null ? null : Number(professor.supportAverage),
      organizationAverage:
        professor.organizationAverage === null ? null : Number(professor.organizationAverage),
      reviews: reviewRows.filter((review) => review.professorId === professor.id),
    })),
  };
}
