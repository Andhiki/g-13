import startHandler from "@tanstack/react-start/server-entry";
import { createDatabase } from "@g13/db/client";
import { withServerErrorReporting } from "./server/error-reporting";
import { pruneOldNotifications } from "./server/notifications";

const NOTIFICATION_PRUNE_CRON = "0 3 * * *";
const E2E_DATABASE_PATH = "/__e2e/database";

type E2EQuery = {
  sql: string;
  params?: (string | number | boolean | null)[];
};

type E2ERequestEnv = {
  DB: D1Database;
  E2E_FIXTURE_TOKEN?: string;
};

function isE2EQuery(query: unknown): query is E2EQuery {
  if (
    typeof query !== "object" ||
    query === null ||
    !("sql" in query) ||
    typeof query.sql !== "string" ||
    query.sql.length > 20_000
  ) {
    return false;
  }
  if (!("params" in query) || query.params === undefined) return true;
  return (
    Array.isArray(query.params) &&
    query.params.every(
      (value) =>
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean",
    )
  );
}

async function handleE2EDatabase(request: Request, env: E2ERequestEnv) {
  const token = env.E2E_FIXTURE_TOKEN;
  if (!token || request.headers.get("authorization") !== `Bearer ${token}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const input: unknown = await request.json();
  const payload =
    typeof input === "object" && input !== null && "batch" in input ? input.batch : input;
  const queries = Array.isArray(payload) ? payload : [payload];
  if (queries.length === 0 || queries.length > 32 || !queries.every(isE2EQuery)) {
    return new Response("Invalid database query", { status: 400 });
  }

  const statements = queries.map(({ sql, params }) => {
    const statement = env.DB.prepare(sql);
    return params ? statement.bind(...params) : statement;
  });
  await env.DB.batch(statements);
  return Response.json({ success: true });
}

export async function handleScheduled(
  controller: Pick<ScheduledController, "cron">,
  env: { DB: D1Database },
  ctx: Pick<ExecutionContext, "waitUntil">,
) {
  switch (controller.cron) {
    case NOTIFICATION_PRUNE_CRON:
      ctx.waitUntil(pruneOldNotifications(createDatabase(env.DB), { olderThanDays: 90 }));
      break;
  }
}

export default {
  async fetch(request: Request, env: E2ERequestEnv) {
    const url = new URL(request.url);
    const isLocalHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (import.meta.env.MODE === "local-e2e" && isLocalHost && url.pathname === E2E_DATABASE_PATH) {
      return handleE2EDatabase(request, env);
    }
    return withServerErrorReporting(request, async (nextRequest) =>
      startHandler.fetch(nextRequest),
    );
  },
  scheduled: handleScheduled,
};
