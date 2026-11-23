import { createHmac, randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import { isolatedDatabaseId, isolatedOrigin, isolatedResourceName } from "./targets.ts";

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
  if (!value) throw new Error(`Missing ${name} for isolated staging`);
  return value;
}

type CloudflareResult<T> = {
  success: boolean;
  result?: T;
  errors?: { code: number; message?: string }[];
};

async function cloudflareRequest<T>(path: string, body?: unknown) {
  const account = required("CLOUDFLARE_ACCOUNT_ID");
  if (!/^[a-f0-9]{32}$/i.test(account)) throw new Error("Invalid Cloudflare account ID");
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: `Bearer ${required("CLOUDFLARE_API_TOKEN")}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await response.json()) as CloudflareResult<T>;
  if (!response.ok || !data.success) {
    const detail =
      data.errors
        ?.map(({ code, message }) => (message ? `${code}: ${message}` : code))
        .join(", ") ?? "none";
    throw new Error(`Cloudflare request failed (HTTP ${response.status}, ${detail})`);
  }
  return data.result as T;
}

type Database = { uuid: string; name: string };

export async function ensureDatabase() {
  const databases = await cloudflareRequest<Database[]>(
    `/d1/database?name=${encodeURIComponent(isolatedResourceName)}`,
  );
  const database =
    databases.find(({ name }) => name === isolatedResourceName) ??
    (await cloudflareRequest<Database>("/d1/database", { name: isolatedResourceName }));
  if (database.name !== isolatedResourceName || !database.uuid) {
    throw new Error(`Refusing D1 access: expected database ${isolatedResourceName}`);
  }
  process.env.E2E_D1_DATABASE_ID = database.uuid;
  const envFile = process.env.GITHUB_ENV;
  if (envFile) appendFileSync(envFile, `E2E_D1_DATABASE_ID=${database.uuid}\n`);
  console.log(`Isolated staging database ${database.name} is ready`);
}

async function cloudflare(path: string, body?: unknown) {
  const result = await cloudflareRequest<{ name?: string } | { success: boolean }[]>(
    `/d1/database/${isolatedDatabaseId()}${path}`,
    body,
  );
  if (Array.isArray(result) && result.some((query) => !query.success)) {
    throw new Error("Isolated D1 query failed");
  }
  return result;
}

export async function verifyDatabase() {
  const metadata = await cloudflare("");
  if (!metadata || Array.isArray(metadata) || metadata.name !== isolatedResourceName) {
    throw new Error(`Refusing D1 access: expected database ${isolatedResourceName}`);
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

export async function resetFixtures({ seed = true }: { seed?: boolean } = {}) {
  await verifyDatabase();
  const rows = cleanup.map((sql) => ({ sql }));
  if (!seed) return cloudflare("/query", { batch: rows });
  await cloudflare("/query", {
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
  await cloudflare("/query", {
    sql: `INSERT INTO auth_session (id, token, user_id, expires_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, unixepoch() * 1000, unixepoch() * 1000)`,
    params: [token, token, `e2e-${role}`, Date.now() + (expired ? -3_600_000 : 3_600_000)],
  });
  const signature = createHmac("sha256", secret).update(token).digest("base64");
  const value = encodeURIComponent(`${token}.${signature}`);
  const attributes = {
    value,
    url: isolatedOrigin,
    secure: true,
    httpOnly: true,
    sameSite: "Lax" as const,
  };
  // Better Auth drops the secure prefix unless NODE_ENV is "production" inside the
  // Worker, so seed both names and let the deployed Worker read the one it uses.
  return [
    { name: "__Secure-better-auth.session_token", ...attributes },
    { name: "better-auth.session_token", ...attributes },
  ];
}

export async function exhaustReviewLimit(action: "submission" | "like") {
  const secret = required("E2E_REVIEW_RATE_LIMIT_SECRET");
  const window = Math.floor(Date.now() / 3_600_000);
  await cloudflare("/query", {
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
