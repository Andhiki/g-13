import { createHmac, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isolatedOrigin, localE2eDatabaseId } from "./targets.ts";

export const fixture = {
  lecturerId: "e2e-lecturer",
  lecturer: "Lecturer Fixture",
  emptyLecturerId: "e2e-empty",
  course: "E2E Algorithms",
  otherCourse: "E2E Databases",
  review: "The seeded algorithms review gives clear examples.",
  otherReview: "The seeded databases review explains the weekly labs.",
};

export type Role = "user" | "maintainer" | "admin";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} for local E2E`);
  return value;
}

function localD1(body: unknown) {
  const statePath = required("E2E_D1_LOCAL_PATH");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const requestPath = join(tmpdir(), `g13-e2e-query-${randomBytes(12).toString("hex")}.json`);
  writeFileSync(requestPath, JSON.stringify(body));
  try {
    const result = spawnSync(
      process.execPath,
      [
        join(root, "apps/web/node_modules/cf/bin/cf"),
        "--mode",
        "local-e2e",
        "d1",
        "raw",
        localE2eDatabaseId,
        "--local",
        "--persist-to",
        statePath,
        "--body",
        `@${requestPath}`,
      ],
      { cwd: join(root, "apps/web"), encoding: "utf8", maxBuffer: 2 * 1024 * 1024 },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`Local D1 query failed: ${result.stderr.trim() || result.stdout.trim()}`);
    }
  } finally {
    rmSync(requestPath, { force: true });
  }
}

const cleanup = [
  "DELETE FROM announcements",
  "DELETE FROM notifications",
  "DELETE FROM notification_events",
  "DELETE FROM auth_account",
  "DELETE FROM auth_session",
  "DELETE FROM auth_user",
  "DELETE FROM auth_verification",
  "DELETE FROM auth_rate_limits",
  "DELETE FROM review_likes",
  "DELETE FROM reviews",
  "DELETE FROM review_submission_limits",
  "DELETE FROM lecturers WHERE id LIKE 'e2e-%'",
  "DELETE FROM courses WHERE id LIKE 'e2e-%' OR code LIKE 'E2ETEST%'",
];

export async function resetFixtures() {
  const rows = cleanup.map((sql) => ({ sql }));
  localD1({
    batch: [
      ...rows,
      {
        sql: "INSERT INTO lecturers (id, name) VALUES (?, ?), (?, ?)",
        params: [
          fixture.lecturerId,
          fixture.lecturer,
          fixture.emptyLecturerId,
          "Empty Lecturer Fixture",
        ],
      },
      {
        sql: "INSERT INTO courses (id, code, name_id, name_en) VALUES ('e2e-algorithms', 'E2E101', ?, ?), ('e2e-databases', 'E2E102', ?, ?)",
        params: [fixture.course, fixture.course, fixture.otherCourse, fixture.otherCourse],
      },
      {
        sql: `INSERT INTO reviews (id, lecturer_id, course_id, term_label, author_name, clarity, support, organization, body, status, created_at)
              VALUES ('e2e-review', ?, 'e2e-algorithms', '2025/2026 Ganjil', 'Seed Author', 4, 4, 4, ?, 'published', (unixepoch() - 3600) * 1000),
              ('e2e-other-review', ?, 'e2e-databases', '2025/2026 Genap', 'Another Author', 2, 2, 2, ?, 'published', unixepoch() * 1000),
              ('e2e-hidden', ?, 'e2e-algorithms', '2025/2026 Ganjil', 'Hidden Author', 1, 1, 1, 'Hidden fixture review', 'hidden', unixepoch() * 1000)`,
        params: [
          fixture.lecturerId,
          fixture.review,
          fixture.lecturerId,
          fixture.otherReview,
          fixture.lecturerId,
        ],
      },
      ...(["user", "maintainer", "admin"] as const).map((role) => ({
        sql: `INSERT INTO auth_user (id, name, email, role, email_verified, created_at, updated_at)
              VALUES (?, ?, ?, ?, 1, unixepoch() * 1000, unixepoch() * 1000)`,
        params: [`e2e-${role}`, `Fixture ${role}`, `${role}@example.test`, role],
      })),
      {
        sql: `INSERT INTO notification_events (id, type, resource_type, resource_id, payload) VALUES
              ('e2e-review-event', 'review.created', 'lecturer_review', 'e2e-review', ?),
              ('e2e-access-event', 'user.pending_approval', 'user', 'e2e-user', ?)`,
        params: [
          JSON.stringify({
            lecturerId: fixture.lecturerId,
            lecturerName: fixture.lecturer,
            courseCode: "E2E101",
          }),
          JSON.stringify({ userName: "Fixture user", userEmail: "user@example.test" }),
        ],
      },
      {
        sql: `INSERT INTO notifications (id, event_id, recipient_id) VALUES
              ('e2e-inbox-review', 'e2e-review-event', 'e2e-maintainer'),
              ('e2e-inbox-access', 'e2e-access-event', 'e2e-admin')`,
      },
    ],
  });
}

export async function seedSession(role: Role, expired = false) {
  const secret = required("E2E_AUTH_SECRET");
  if (secret.length < 32) throw new Error("E2E_AUTH_SECRET must have at least 32 characters");
  const token = randomBytes(32).toString("hex");
  localD1({
    sql: `INSERT INTO auth_session (id, token, user_id, expires_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, unixepoch() * 1000, unixepoch() * 1000)`,
    params: [token, token, `e2e-${role}`, Date.now() + (expired ? -3_600_000 : 3_600_000)],
  });
  const signature = createHmac("sha256", secret).update(token).digest("base64");
  const value = encodeURIComponent(`${token}.${signature}`);
  const attributes = {
    value,
    url: isolatedOrigin,
    secure: new URL(isolatedOrigin).protocol === "https:",
    httpOnly: true,
    sameSite: "Lax" as const,
  };
  return [{ name: "better-auth.session_token", ...attributes }];
}

export async function exhaustReviewLimit(action: "submission" | "like") {
  const secret = required("E2E_REVIEW_RATE_LIMIT_SECRET");
  const window = Math.floor(Date.now() / 3_600_000);
  localD1({
    batch: [window, window + 1].map((hour) => ({
      sql: `INSERT INTO review_submission_limits ("key", "count", "expires_at") VALUES (?, ?, ?)
            ON CONFLICT("key") DO UPDATE SET "count" = excluded."count", "expires_at" = excluded."expires_at"`,
      params: [
        createHmac("sha256", secret).update(`${action}:${hour}:192.0.2.60`).digest("hex"),
        action === "submission" ? 3 : 60,
        (hour + 1) * 3_600_000,
      ],
    })),
  });
}
