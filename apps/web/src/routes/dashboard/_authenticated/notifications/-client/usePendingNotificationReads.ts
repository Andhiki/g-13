import { useMutationState } from "@tanstack/react-query";
import { notificationReadMutationKey } from "./queries";

export function usePendingNotificationReadIds() {
  const pendingReadIds = useMutationState({
    filters: { mutationKey: notificationReadMutationKey, status: "pending" },
    select: (mutation) => mutation.state.variables,
  });

  return new Set(
    pendingReadIds.filter(
      (notificationId): notificationId is string => typeof notificationId === "string",
    ),
  );
}
