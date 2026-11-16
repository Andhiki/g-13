import { and, asc, desc, eq, inArray, isNotNull, isNull, notInArray, sql } from "drizzle-orm";
import { authUser, courses, lecturers, reviews, type createDatabase } from "@g13/db";
import type { AssignRoleInput, ReviewStatus, UserStatus } from "../shared/schemas";

type Database = ReturnType<typeof createDatabase>;

export async function listModerationReviews(db: Database, offset: number, status: ReviewStatus) {
  return db
    .select({
      id: reviews.id,
      lecturerName: lecturers.name,
      courseCode: courses.code,
      authorName: reviews.authorName,
      termLabel: reviews.termLabel,
      body: reviews.body,
      clarity: reviews.clarity,
      support: reviews.support,
      organization: reviews.organization,
      status: reviews.status,
      deletedAt: reviews.deletedAt,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(lecturers, eq(lecturers.id, reviews.lecturerId))
    .innerJoin(courses, eq(courses.id, reviews.courseId))
    .where(
      status === "all"
        ? undefined
        : status === "deleted"
          ? isNotNull(reviews.deletedAt)
          : and(eq(reviews.status, status), isNull(reviews.deletedAt)),
    )
    .orderBy(desc(reviews.createdAt), desc(reviews.id))
    .limit(51)
    .offset(offset);
}

export async function getModerationCounts(db: Database) {
  const [counts] = await db
    .select({
      all: sql<number>`count(*)`,
      published: sql<number>`coalesce(sum(case when ${reviews.status} = 'published' and ${reviews.deletedAt} is null then 1 else 0 end), 0)`,
      hidden: sql<number>`coalesce(sum(case when ${reviews.status} = 'hidden' and ${reviews.deletedAt} is null then 1 else 0 end), 0)`,
      deleted: sql<number>`coalesce(sum(case when ${reviews.deletedAt} is not null then 1 else 0 end), 0)`,
    })
    .from(reviews);
  return counts;
}

export async function listAdminUsers(db: Database, offset: number, status: UserStatus) {
  return db
    .select({
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      createdAt: authUser.createdAt,
    })
    .from(authUser)
    .where(
      status === "all"
        ? undefined
        : status === "approved"
          ? inArray(authUser.role, ["admin", "maintainer"])
          : notInArray(authUser.role, ["admin", "maintainer"]),
    )
    .orderBy(asc(authUser.name), asc(authUser.id))
    .limit(51)
    .offset(offset);
}

export async function getUserCounts(db: Database) {
  const [counts] = await db
    .select({
      all: sql<number>`count(*)`,
      approved: sql<number>`coalesce(sum(case when ${authUser.role} in ('admin', 'maintainer') then 1 else 0 end), 0)`,
      pending: sql<number>`coalesce(sum(case when ${authUser.role} not in ('admin', 'maintainer') then 1 else 0 end), 0)`,
    })
    .from(authUser);
  return counts;
}

export async function assignUserRole(db: Database, input: AssignRoleInput): Promise<boolean> {
  const [user] = await db
    .update(authUser)
    .set({ role: input.role, updatedAt: new Date() })
    .where(eq(authUser.id, input.userId))
    .returning({ id: authUser.id });
  return user !== undefined;
}
