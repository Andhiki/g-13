import { NOTIFICATION_ERRORS, type NotificationError } from "../-shared/errors";

export function rejectNotificationOperation(error: NotificationError): never {
  switch (error) {
    case NOTIFICATION_ERRORS.NOT_FOUND:
      throw new Response("Notification not found", { status: 404 });
    case NOTIFICATION_ERRORS.FORBIDDEN:
      throw new Response("Access denied", { status: 403 });
  }
}
