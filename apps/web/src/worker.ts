import startHandler from "@tanstack/react-start/server-entry";
import { createDatabase } from "@g13/db";
import { pruneOldNotifications } from "./server/notifications";

export const NOTIFICATION_PRUNE_CRON = "0 3 * * *";

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
  fetch: startHandler.fetch,
  scheduled: handleScheduled,
};
