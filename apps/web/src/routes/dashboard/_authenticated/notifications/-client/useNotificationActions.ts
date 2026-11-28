import { useMutation, useMutationState, useQueryClient } from "@tanstack/react-query";
import {
  archiveNotificationAction,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../-server/handler";
import { notificationArchiveMutationKey, notificationReadMutationKey } from "./queries";
import { usePendingNotificationReadIds } from "./usePendingNotificationReads";

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
    mutationKey: notificationArchiveMutationKey,
    mutationFn: (notificationId: string) => archiveNotificationAction({ data: { notificationId } }),
    onSuccess: invalidateNotifications,
  });

  const pendingReadIds = usePendingNotificationReadIds();
  const pendingArchiveIds = new Set(
    useMutationState({
      filters: { mutationKey: notificationArchiveMutationKey, status: "pending" },
      select: (mutation) => mutation.state.variables,
    }).filter((notificationId): notificationId is string => typeof notificationId === "string"),
  );

  // Only the notification being changed waits; "mark all read" touches every row.
  const isBusy = (notificationId: string) =>
    readAllMutation.isPending ||
    pendingReadIds.has(notificationId) ||
    pendingArchiveIds.has(notificationId);
  const isArchiving = (notificationId: string) => pendingArchiveIds.has(notificationId);

  return { readMutation, readAllMutation, archiveMutation, isBusy, isArchiving };
}
