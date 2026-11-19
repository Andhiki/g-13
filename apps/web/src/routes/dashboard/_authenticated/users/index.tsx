import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { canManageUsers, canModerate } from "@g13/auth";
import { RiGroupLine } from "@remixicon/react";
import { changeUserRole } from "./-server/handler";
import { adminUsersQuery } from "./-client/queries";
import { userStatusSchema, type AssignRoleInput, type UserStatus } from "./-shared/schemas";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignModal } from "@/ui/modal";
import { Typography } from "@/ui/typography";
import { useAdminLayout } from "../-components/AdminLayoutContext";
import { AdminPageHeader } from "../-components/AdminPageHeader";
import { AdminPagination } from "../-components/AdminPagination";
import { AdminUserList } from "./-components/AdminUserList";
import { UserAccessInspector } from "./-components/UserAccessInspector";

export const Route = createFileRoute("/dashboard/_authenticated/users/")({
  loader: async ({ context }) => {
    try {
      return await context.queryClient.fetchQuery(adminUsersQuery());
    } catch (error) {
      if (error instanceof Response && error.status === 401)
        throw redirect({ to: "/dashboard/login" });
      if (error instanceof Response && error.status === 403)
        throw redirect({ to: "/dashboard/lecturer-reviews" });
      throw error;
    }
  },
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { identity } = Route.useLoaderData();
  const { detailsOpen, setDetailsOpen } = useAdminLayout();
  const [offset, setOffset] = useState(0);
  const [userStatus, setUserStatus] = useState<UserStatus>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    input: AssignRoleInput;
    label: string;
  } | null>(null);
  const queryClient = useQueryClient();
  const users = useQuery(adminUsersQuery(offset, userStatus));
  const userRows = users.data?.rows ?? [];
  const visibleRows = userRows.slice(0, 50);
  const count = visibleRows.length;
  const total = users.data?.counts[userStatus] ?? 0;
  const selectedUser =
    visibleRows.find((user) => user.id === selectedUserId) ??
    visibleRows.find((user) => !canModerate(user.role)) ??
    visibleRows[0];
  const detailsVisible = detailsOpen && !!selectedUser && !users.isPending && !users.isError;
  const mutation = useMutation({
    mutationFn: (input: AssignRoleInput) => changeUserRole({ data: input }),
    onSuccess: async () => {
      setConfirmation(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
        queryClient.invalidateQueries({ queryKey: ["lecturer-reviews"] }),
      ]);
    },
  });

  function confirmRole(input: AssignRoleInput, label: string) {
    mutation.reset();
    setConfirmation({ input, label });
  }

  return (
    <>
      <AdminPageHeader
        title="User access"
        icon={<RiGroupLine className="hidden size-4 text-text-sub-600 md:block" />}
        manager={canManageUsers(identity.role)}
        userName={identity.name}
        detailsAvailable={!!selectedUser}
        detailsVisible={detailsVisible}
        isFetching={users.isFetching}
        onToggleDetails={() => setDetailsOpen((open) => !open)}
        onRefresh={() => void users.refetch()}
      />
      <div
        className="flex min-h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-stroke-soft-200 px-3 py-1.5"
        aria-label="Account approval filters"
      >
        {userStatusSchema.options.map((value) => (
          <AlignButton.Root
            key={value}
            size="xxsmall"
            variant="neutral"
            mode={userStatus === value ? "lighter" : "ghost"}
            className="gap-2 text-label-xs"
            aria-pressed={userStatus === value}
            onClick={() => {
              setUserStatus(value);
              setOffset(0);
              setSelectedUserId(null);
            }}
          >
            {value === "all"
              ? "All accounts"
              : value === "pending"
                ? "Pending approval"
                : "Approved"}
            <span className="text-text-sub-600 tabular-nums">
              {users.data?.counts[value] ?? "—"}
            </span>
          </AlignButton.Root>
        ))}
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg-weak-50">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-white-0">
            {users.isError ? (
              <Typography role="alert" className="p-4">
                Unable to load protected data. Refresh or sign in again.
              </Typography>
            ) : users.isPending ? (
              <Typography role="status" className="p-4">
                Loading…
              </Typography>
            ) : (
              <>
                <AdminUserList
                  users={visibleRows}
                  identityId={identity.id}
                  selectedId={selectedUser?.id}
                  onSelect={(id) => {
                    setSelectedUserId(id);
                    setDetailsOpen(true);
                  }}
                  onAssign={confirmRole}
                />
                {!userRows.length && (
                  <Typography
                    variant="caption"
                    className="px-4 py-10 text-center text-text-sub-600"
                  >
                    No accounts match this filter.
                  </Typography>
                )}
              </>
            )}
          </div>
          {!users.isPending && !users.isError && (
            <AdminPagination
              count={count}
              offset={offset}
              total={total}
              label="accounts"
              hasNext={userRows.length > 50}
              onPrevious={() => setOffset((current) => current - 50)}
              onNext={() => setOffset((current) => current + 50)}
            />
          )}
        </div>
        {selectedUser && detailsVisible && (
          <UserAccessInspector
            key={selectedUser.id}
            user={selectedUser}
            identityId={identity.id}
            onAssign={confirmRole}
          />
        )}
      </div>
      <AlignModal.Root
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setConfirmation(null);
        }}
      >
        <AlignModal.Content className="p-5">
          <AlignModal.Title>Confirm role assignment</AlignModal.Title>
          <AlignModal.Description className="mt-2 pr-4">
            {confirmation?.label}. Assign {confirmation?.input.role}. This changes protected access
            on the next request.
          </AlignModal.Description>
          {mutation.isError && (
            <Typography role="alert" className="mt-3 text-error-base">
              Change failed. Refresh and check your access before trying again.
            </Typography>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <AlignButton.Root
              size="small"
              variant="neutral"
              mode="stroke"
              disabled={mutation.isPending}
              onClick={() => setConfirmation(null)}
            >
              Cancel
            </AlignButton.Root>
            <AlignFancyButton.Root
              className="h-8 text-label-xs"
              disabled={mutation.isPending}
              onClick={() => {
                if (confirmation) mutation.mutate(confirmation.input);
              }}
            >
              {mutation.isPending ? "Saving…" : "Confirm"}
            </AlignFancyButton.Root>
          </div>
        </AlignModal.Content>
      </AlignModal.Root>
    </>
  );
}
