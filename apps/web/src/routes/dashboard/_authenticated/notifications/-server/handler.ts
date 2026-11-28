import { createServerFn } from "@tanstack/react-start";
import { authenticatedMiddleware } from "@/server/auth-middleware";
import { loadAdminPage, runAdminOperation } from "../../-server/admin-handler";
import { NOTIFICATION_ERRORS, type NotificationError } from "../-shared/errors";
import { notificationIdSchema, notificationsPageSchema } from "../-shared/schemas";
import {
  archiveUserNotification,
  inspectNotifications,
  readAllNotifications,
  readNotification,
} from "./service";

const notificationErrorStatuses = {
  [NOTIFICATION_ERRORS.NOT_FOUND]: 404,
  [NOTIFICATION_ERRORS.FORBIDDEN]: 403,
} satisfies Record<NotificationError, number>;

const notificationErrorMessages = {
  [NOTIFICATION_ERRORS.NOT_FOUND]: "Notification not found",
  [NOTIFICATION_ERRORS.FORBIDDEN]: "Access denied",
} satisfies Record<NotificationError, string>;

const rejectNotification = (status: number, error: NotificationError): never => {
  throw new Response(notificationErrorMessages[error], { status });
};

export const loadNotifications = createServerFn({ method: "GET" })
  .middleware([authenticatedMiddleware])
  .validator(notificationsPageSchema)
  .handler(({ data, context: { session } }) =>
    loadAdminPage(
      session.user,
      notificationErrorStatuses,
      (db) => inspectNotifications(db, session.user, data.cursor, data.filter),
      { reject: rejectNotification },
    ),
  );

export const markNotificationAsRead = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .validator(notificationIdSchema)
  .handler(({ data, context: { session } }) =>
    runAdminOperation(
      notificationErrorStatuses,
      (db) => readNotification(db, session.user, data.notificationId),
      { reject: rejectNotification },
    ),
  );

export const markAllNotificationsAsRead = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .handler(({ context: { session } }) =>
    runAdminOperation(notificationErrorStatuses, (db) => readAllNotifications(db, session.user), {
      reject: rejectNotification,
    }),
  );

export const archiveNotificationAction = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .validator(notificationIdSchema)
  .handler(({ data, context: { session } }) =>
    runAdminOperation(
      notificationErrorStatuses,
      (db) => archiveUserNotification(db, session.user, data.notificationId),
      { reject: rejectNotification },
    ),
  );
