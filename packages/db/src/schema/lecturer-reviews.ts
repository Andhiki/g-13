import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { courses } from "./courses";
import { lecturers } from "./lecturers";

/** Why a submitted review waits for moderation instead of publishing. */
export const reviewPendingReasons = [
  "low-rating",
  "contact-details",
  "moderation",
  "profanity",
  "unscorable",
] as const;
export type ReviewPendingReason = (typeof reviewPendingReasons)[number];

export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    lecturerId: text("lecturer_id")
      .notNull()
      .references(() => lecturers.id),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id),
    termLabel: text("term_label").notNull(),
    authorName: text("author_name").notNull(),
    clarity: integer("clarity").notNull(),
    support: integer("support").notNull(),
    organization: integer("organization").notNull(),
    body: text("body").notNull(),
    status: text("status", { enum: ["pending", "published", "hidden"] })
      .notNull()
      .default("published"),
    /** Set when a submission is held; null for reviews that published directly or predate it. */
    pendingReasons: text("pending_reasons", { mode: "json" }).$type<ReviewPendingReason[]>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("reviews_lecturer_course_idx").on(table.lecturerId, table.courseId),
    index("reviews_status_deleted_idx").on(table.status, table.deletedAt),
    check(
      "reviews_ratings_range",
      sql`${table.clarity} between 1 and 5 and ${table.support} between 1 and 5 and ${table.organization} between 1 and 5`,
    ),
    check("reviews_status_valid", sql`${table.status} in ('pending', 'published', 'hidden')`),
  ],
);

export const reviewLikes = sqliteTable(
  "review_likes",
  {
    reviewId: text("review_id")
      .notNull()
      .references(() => reviews.id),
    browserId: text("browser_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    primaryKey({ columns: [table.reviewId, table.browserId] }),
    index("review_likes_browser_id_idx").on(table.browserId),
  ],
);

export const reviewSubmissionLimits = sqliteTable(
  "review_submission_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [index("review_submission_limits_expires_at_idx").on(table.expiresAt)],
);
