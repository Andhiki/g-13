import { RiGroupLine } from "@remixicon/react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { canManageUsers, canModerate } from "@g13/auth";
import { changeUserRole } from "./-server/handler";
import { adminUsersQuery } from "./-client/queries";
import { userStatusSchema, type AssignRoleInput, type UserStatus } from "./-shared/schemas";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";
import { AdminFilterBar } from "../-components/AdminFilterBar";
import { useAdminLayout } from "../-components/AdminLayoutContext";
import { AdminInspector, desktopInspectorQuery } from "../-components/AdminInspector";
import { AdminPageHeader, DetailsToggleButton } from "../-components/AdminPageHeader";
import { AdminPagination } from "../-components/AdminPagination";
import { ConfirmationChange } from "../-components/ConfirmationChange";
import { DashboardEmptyState } from "../-components/DashboardEmptyState";
import { DashboardPending, DashboardRoutePending } from "../-components/DashboardPending";
import { ConfirmActionModal } from "../-components/ConfirmActionModal";
import { AdminUserList } from "./-components/AdminUserList";
import { roleOptions, type AssignableRole } from "./-components/role-options";
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
  pendingComponent: DashboardRoutePending,
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const initialData = Route.useLoaderData();
  const { identity } = initialData;
  const { detailsOpen, setDetailsOpen } = useAdminLayout();
  const [offset, setOffset] = useState(0);
  const [userStatus, setUserStatus] = useState<UserStatus>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    input: AssignRoleInput;
    label: string;
    from: AssignableRole;
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
    if (!selectedUser) return;
    mutation.reset();
    setConfirmation({
      input,
      label,
      from: canModerate(selectedUser.role) ? selectedUser.role : "user",
    });
  }

  return (
    <>
      <AdminPageHeader
        title="User access"
        manager={canManageUsers(identity.role)}
        userName={identity.name}
        userEmail={identity.email}
        userImage={identity.image}
      />
      <AdminFilterBar
        ariaLabel="Account approval filters"
        tabs={userStatusSchema.options.map((value) => ({
          value,
          label:
            value === "all"
              ? "All accounts"
              : value === "pending"
                ? "Pending approval"
                : "Approved",
          count: counts[value],
        }))}
        activeTab={userStatus}
        onTabChange={(value) => {
          setUserStatus(value);
          setOffset(0);
          setSelectedUserId(null);
        }}
      >
        <DetailsToggleButton
          available={!!selectedUser}
          visible={detailsVisible}
          onToggle={() => setDetailsOpen((open) => !open)}
        />
      </AdminFilterBar>
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
          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-white-0 ${count === 0 ? "flex flex-col" : ""}`}
          >
            {users.isError ? (
              <div className="p-4">
                <Typography role="alert">
                  Could not load accounts. Refresh or sign in again.
                </Typography>
              </div>
            ) : users.isPending ? (
              <DashboardPending />
            ) : (
              <>
                <AdminUserList
                  users={visibleRows}
                  identityId={identity.id}
                  selectedId={selectedUser?.id}
                  onSelect={(id) => {
                    setSelectedUserId(id);
                    setDetailsOpen(true);
                    setMobileDetailsOpen(!window.matchMedia(desktopInspectorQuery).matches);
                  }}
                />
                {!count && (
                  <DashboardEmptyState
                    icon={<RiGroupLine />}
                    title={userStatus === "all" ? "No accounts yet" : `No ${userStatus} accounts`}
                    description={
                      userStatus === "all"
                        ? "Accounts are created on a user's first GitHub sign-in. New accounts appear here until an admin assigns access."
                        : userStatus === "pending"
                          ? "New GitHub sign-ins wait here until an admin assigns an access role."
                          : "Accounts with an assigned dashboard role appear here."
                    }
                    action={
                      userStatus !== "all" && counts.all > 0 ? (
                        <AlignButton.Root
                          size="small"
                          variant="neutral"
                          mode="stroke"
                          onClick={() => {
                            setUserStatus("all");
                            setOffset(0);
                          }}
                        >
                          View all accounts
                        </AlignButton.Root>
                      ) : undefined
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>
        <AdminInspector
          title="Account details"
          desktopOpen={detailsVisible}
          mobileOpen={mobileDetailsOpen}
          onMobileOpenChange={setMobileDetailsOpen}
        >
          {selectedUser && !users.isPending && !users.isError && (
            <UserAccessInspector
              key={selectedUser.id}
              user={selectedUser}
              identityId={identity.id}
              onAssign={confirmRole}
            />
          )}
        </AdminInspector>
      </div>
      <ConfirmActionModal
        open={confirmation !== null}
        destructive={confirmation?.input.role === "user"}
        title={confirmation?.input.role === "user" ? "Revoke access" : "Confirm role change"}
        description={
          <>
            <strong className="text-text-strong-950">{confirmation?.label}</strong>. Access updates
            on their next request.
          </>
        }
        confirmLabel={confirmation?.input.role === "user" ? "Revoke access" : "Save role"}
        error={mutation.isError ? "Update failed. Refresh and try again." : undefined}
        pending={mutation.isPending}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation) mutation.mutate(confirmation.input);
        }}
      >
        {confirmation && (
          <ConfirmationChange
            from={<RoleLabel role={confirmation.from} />}
            to={<RoleLabel role={confirmation.input.role} />}
          />
        )}
      </ConfirmActionModal>
    </>
  );
}

function RoleLabel({ role }: { role: AssignableRole }) {
  const option = roleOptions.find(({ value }) => value === role);
  if (!option) return null;
  return (
    <span className="flex items-center gap-1.5 text-label-sm font-semibold">
      <option.Icon aria-hidden="true" className="size-4 shrink-0" />
      {option.label}
    </span>
  );
}
