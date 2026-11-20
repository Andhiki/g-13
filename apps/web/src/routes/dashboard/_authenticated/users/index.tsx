import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { canManageUsers, canModerate } from "@g13/auth";
import { changeUserRole } from "./-server/handler";
import { adminUsersQuery } from "./-client/queries";
import { userStatusSchema, type AssignRoleInput, type UserStatus } from "./-shared/schemas";
import { AlignButton } from "@/ui/button";
import { Loading } from "@/ui/loading";
import { Typography } from "@/ui/typography";
import { useAdminLayout } from "../-components/AdminLayoutContext";
import { AdminPageHeader, DetailsToggleButton } from "../-components/AdminPageHeader";
import { AdminPagination } from "../-components/AdminPagination";
import { ConfirmActionModal } from "../-components/ConfirmActionModal";
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
  pendingComponent: () => (
    <div className="flex flex-1 items-center justify-center p-6">
      <Loading />
    </div>
  ),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const initialData = Route.useLoaderData();
  const { identity } = initialData;
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
  const counts = users.data?.counts ?? initialData.counts;
  const userRows = users.data?.rows ?? [];
  const visibleRows = userRows.slice(0, 50);
  const count = visibleRows.length;
  const total = counts[userStatus];
  const selectedUser =
    visibleRows.find((user) => user.id === selectedUserId) ??
    visibleRows.find((user) => !canModerate(user.role)) ??
    visibleRows[0];
  const detailsVisible = detailsOpen && !!selectedUser && !users.isPending && !users.isError;
  const mutation = useMutation({
    mutationFn: (input: AssignRoleInput) => changeUserRole({ data: input }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
        queryClient.invalidateQueries({ queryKey: ["lecturer-reviews"] }),
      ]);
      setConfirmation(null);
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
        manager={canManageUsers(identity.role)}
        userName={identity.name}
      />
      <div
        className="flex min-h-11 shrink-0 items-center justify-between gap-2 border-b border-stroke-soft-200 px-3 py-1.5"
        aria-label="Account approval filters"
      >
        <div className="flex items-center gap-1 overflow-x-auto">
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
              <span className="text-text-sub-600 tabular-nums">{counts[value]}</span>
            </AlignButton.Root>
          ))}
        </div>
        <DetailsToggleButton
          available={!!selectedUser}
          visible={detailsVisible}
          onToggle={() => setDetailsOpen((open) => !open)}
        />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg-white-0">
          {!users.isPending && !users.isError && (
            <AdminPagination
              count={count}
              offset={offset}
              total={total}
              label="accounts"
              hasNext={userRows.length > 50}
              onPrevious={() => setOffset((current) => Math.max(0, current - 50))}
              onNext={() => setOffset((current) => current + 50)}
            />
          )}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-white-0">
            {users.isError ? (
              <Typography role="alert" className="p-4">
                Could not load accounts. Refresh or sign in again.
              </Typography>
            ) : users.isPending ? (
              <div className="flex h-full min-h-64 items-center justify-center p-6">
                <Loading />
              </div>
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
        </div>
        <div
          inert={!detailsVisible}
          data-open={detailsVisible}
          className="hidden w-0 shrink-0 overflow-clip transition-[width] duration-200 ease-out data-[open=true]:w-[320px] xl:block motion-reduce:transition-none"
        >
          {selectedUser && !users.isPending && !users.isError && (
            <UserAccessInspector
              key={selectedUser.id}
              user={selectedUser}
              identityId={identity.id}
              onAssign={confirmRole}
            />
          )}
        </div>
      </div>
      <ConfirmActionModal
        open={confirmation !== null}
        title={confirmation?.input.role === "user" ? "Revoke access" : "Confirm role change"}
        description={
          confirmation?.input.role === "user"
            ? `Remove moderation access for ${confirmation.label}. Access updates on their next request.`
            : `Set ${confirmation?.label ?? ""} to ${confirmation?.input.role ?? ""}. Access updates on their next request.`
        }
        error={mutation.isError ? "Update failed. Refresh and try again." : undefined}
        pending={mutation.isPending}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation) mutation.mutate(confirmation.input);
        }}
      />
    </>
  );
}
