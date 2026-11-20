import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { runServerOperation } from "@/server/server-function-error";
import { authenticatedMiddleware } from "@/server/auth-middleware";
import { notificationIdSchema, notificationsPageSchema } from "../-shared/schemas";
import { rejectNotificationOperation } from "./failures";
import {
  archiveUserNotification,
  inspectNotifications,
  readAllNotifications,
  readNotification,
} from "./service";

export const loadNotifications = createServerFn({ method: "GET" })
  .middleware([authenticatedMiddleware])
  .validator(notificationsPageSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      inspectNotifications(createDatabase(env.DB), session.user, data.offset, data.filter),
    );
    if (result.error !== null) rejectNotificationOperation(result.error);
    return {
      ...result.data,
      identity: { id: session.user.id, name: session.user.name, role: session.user.role },
    };
  });

export const markNotificationAsRead = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .validator(notificationIdSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      readNotification(createDatabase(env.DB), session.user, data.notificationId),
    );
    if (result.error !== null) rejectNotificationOperation(result.error);
    return result.data;
  });

export const markAllNotificationsAsRead = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      readAllNotifications(createDatabase(env.DB), session.user),
    );
    if (result.error !== null) rejectNotificationOperation(result.error);
    return result.data;
  });

export const archiveNotificationAction = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .validator(notificationIdSchema)
  .handler(async ({ data, context }) => {
    const { session } = context;
    const result = await runServerOperation(() =>
      archiveUserNotification(createDatabase(env.DB), session.user, data.notificationId),
    );
    if (result.error !== null) rejectNotificationOperation(result.error);
    return result.data;
  });
