import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  archiveNotificationAction,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../-server/handler";
import { notificationReadMutationKey } from "./queries";

export function useNotificationActions() {
  const queryClient = useQueryClient();

  async function invalidateNotifications() {
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  const readMutation = useMutation({
    mutationKey: notificationReadMutationKey,
    mutationFn: (notificationId: string) => markNotificationAsRead({ data: { notificationId } }),
    onSuccess: invalidateNotifications,
  });

  const readAllMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: invalidateNotifications,
  });

  const archiveMutation = useMutation({
    mutationFn: (notificationId: string) => archiveNotificationAction({ data: { notificationId } }),
    onSuccess: invalidateNotifications,
  });

  const busy = readMutation.isPending || readAllMutation.isPending || archiveMutation.isPending;

  return { readMutation, readAllMutation, archiveMutation, busy };
}
