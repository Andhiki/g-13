import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const lecturers = sqliteTable("lecturers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  nameId: text("name_id").notNull(),
  nameEn: text("name_en").notNull(),
});

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
    status: text("status", { enum: ["published", "hidden"] })
      .notNull()
      .default("published"),
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
    check("reviews_status_valid", sql`${table.status} in ('published', 'hidden')`),
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
  (table) => [primaryKey({ columns: [table.reviewId, table.browserId] })],
);

export const reviewSubmissionLimits = sqliteTable("review_submission_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export const authUser = sqliteTable("auth_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const authSession = sqliteTable(
  "auth_session",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [index("auth_session_user_idx").on(table.userId)],
);

export const authAccount = sqliteTable(
  "auth_account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("auth_account_user_idx").on(table.userId)],
);

export const authVerification = sqliteTable(
  "auth_verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("auth_verification_identifier_idx").on(table.identifier)],
);

export const authRateLimits = sqliteTable("auth_rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export const schema = {
  lecturers,
  courses,
  reviews,
  reviewLikes,
  reviewSubmissionLimits,
  authUser,
  authSession,
  authAccount,
  authVerification,
  authRateLimits,
};
