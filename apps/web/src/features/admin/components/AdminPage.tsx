import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiChatCheckLine,
  RiGroupLine,
  RiLayoutRightLine,
  RiRefreshLine,
} from "@remixicon/react";
import { canManageUsers, canModerate } from "@g13/auth";
import { AlignTabMenuVertical as Tabs } from "../../../ui/tab-menu-vertical";
import { AlignButton } from "../../../ui/button";
import { AlignFancyButton } from "../../../ui/fancy-button";
import { AlignModal } from "../../../ui/modal";
import { Typography } from "../../../ui/typography";
import { authClient } from "../client/auth";
import { adminUsersQuery, moderationReviewsQuery } from "../client/queries";
import { changeReviewVisibility, changeUserRole, type loadAdminIdentity } from "../server/handler";
import type { AssignRoleInput, ReviewStatus, UserStatus } from "../shared/schemas";
import type { ModerateReviewInput } from "../../lecturer-reviews/shared/moderation";
import { AdminReviewRow } from "./AdminReviewRow";
import { AdminUserList } from "./AdminUserList";
import { ReviewInspector } from "./ReviewInspector";
import { UserAccessInspector } from "./UserAccessInspector";
import { MobileModerationMenu, ModerationSidebar } from "./ModerationNavigation";

type Identity = NonNullable<Awaited<ReturnType<typeof loadAdminIdentity>>>;
type Confirmation =
  | { kind: "review"; label: string; input: ModerateReviewInput }
  | { kind: "role"; label: string; input: AssignRoleInput };

export function AdminPage({ identity }: { identity: Identity }) {
  const [tab, setTab] = useState("reviews");
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<ReviewStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [signOutError, setSignOutError] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const queryClient = useQueryClient();
  const router = useRouter();
  const manager = canManageUsers(identity.role);
  const reviews = useQuery({
    ...moderationReviewsQuery(offset, status),
    enabled: tab === "reviews",
  });
  const users = useQuery({
    ...adminUsersQuery(offset, userStatus),
    enabled: manager && tab === "users",
  });
  const current = tab === "reviews" ? reviews : users;
  const reviewRows = reviews.data?.rows ?? [];
  const userRows = users.data?.rows ?? [];
  const currentRows = tab === "reviews" ? reviewRows : userRows;
  const count = Math.min(currentRows.length, 50);
  const total =
    (tab === "reviews" ? reviews.data?.counts[status] : users.data?.counts[userStatus]) ?? 0;
  const selectedReview =
    reviewRows.slice(0, 50).find((review) => review.id === selectedId) ?? reviewRows[0];
  const selectedUser =
    userRows.slice(0, 50).find((user) => user.id === selectedUserId) ??
    userRows.slice(0, 50).find((user) => !canModerate(user.role)) ??
    userRows[0];
  const inspectorAvailable = tab === "reviews" ? !!selectedReview : manager && !!selectedUser;
  const detailsVisible =
    inspectorOpen && inspectorAvailable && !current.isPending && !current.isError;
  const mutation = useMutation({
    mutationFn: async (action: Confirmation) => {
      const result =
        action.kind === "review"
          ? await changeReviewVisibility({ data: action.input })
          : await changeUserRole({ data: action.input });
      if (!result.ok) throw new Error("The record no longer permits this change");
    },
    onSuccess: async () => {
      setConfirmation(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
        queryClient.invalidateQueries({ queryKey: ["lecturer-reviews"] }),
      ]);
    },
  });

  function confirmReview(input: ModerateReviewInput, label: string) {
    mutation.reset();
    setConfirmation({ kind: "review", input, label });
  }

  function confirmRole(input: AssignRoleInput, label: string) {
    mutation.reset();
    setConfirmation({ kind: "role", input, label });
  }

  function changeSection(value: string) {
    setTab(value);
    setOffset(0);
  }

  async function signOut() {
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setSignOutError(true);
        return;
      }
      queryClient.clear();
      await router.navigate({ to: "/login" });
    } catch {
      setSignOutError(true);
    }
  }

  const pagination = (
    <footer className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-stroke-soft-200 bg-bg-white-0 px-4">
      <Typography variant="caption" className="text-text-sub-600 tabular-nums">
        {count
          ? `${offset + 1}–${offset + count} of ${total} ${tab === "reviews" ? "reviews" : "accounts"}`
          : "0 records"}
      </Typography>
      <div className="flex gap-1.5">
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          className="gap-1 text-label-xs disabled:text-text-sub-600"
          disabled={!offset}
          onClick={() => setOffset(offset - 50)}
        >
          <RiArrowLeftLine className="size-3.5" />
          Previous
        </AlignButton.Root>
        <AlignButton.Root
          size="xxsmall"
          variant="neutral"
          mode="ghost"
          className="gap-1 text-label-xs disabled:text-text-sub-600"
          disabled={currentRows.length <= 50}
          onClick={() => setOffset(offset + 50)}
        >
          Next
          <RiArrowRightLine className="size-3.5" />
        </AlignButton.Root>
      </div>
    </footer>
  );

  return (
    <main className="h-full min-h-0 bg-bg-weak-50 text-text-strong-950 md:p-1.5">
      <Tabs.Root
        value={tab}
        onValueChange={changeSection}
        className="flex h-full min-h-0 flex-col md:flex-row"
      >
        <ModerationSidebar manager={manager} onSignOut={() => void signOut()} />
        <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-stroke-soft-200 bg-bg-white-0 md:rounded-xl md:border">
          <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-stroke-soft-200 px-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <MobileModerationMenu
                manager={manager}
                section={tab}
                onSelect={changeSection}
                onSignOut={() => void signOut()}
              />
              {tab === "reviews" ? (
                <RiChatCheckLine className="hidden size-4 text-text-sub-600 md:block" />
              ) : (
                <RiGroupLine className="hidden size-4 text-text-sub-600 md:block" />
              )}
              <Typography as="h1" variant="label" className="truncate">
                {tab === "reviews" ? "Lecturer reviews" : "User access"}
              </Typography>
            </div>
            <div className="flex items-center gap-1">
              <AlignButton.Root
                size="xsmall"
                variant="neutral"
                mode="ghost"
                className="hidden w-8 px-0 aria-expanded:bg-bg-weak-50 xl:inline-flex"
                disabled={!inspectorAvailable}
                aria-label={detailsVisible ? "Hide details" : "Show details"}
                title={detailsVisible ? "Hide details" : "Show details"}
                aria-expanded={detailsVisible}
                aria-controls="moderation-inspector"
                onClick={() => setInspectorOpen((open) => !open)}
              >
                <RiLayoutRightLine className="size-4" />
              </AlignButton.Root>
              <AlignButton.Root
                size="xsmall"
                variant="neutral"
                mode="ghost"
                className="gap-1.5 text-label-xs"
                disabled={current.isFetching}
                onClick={() => void current.refetch()}
              >
                <RiRefreshLine className="size-3.5" />
                Refresh
              </AlignButton.Root>
            </div>
          </header>
          {signOutError && (
            <Typography
              role="alert"
              variant="caption"
              className="border-b border-stroke-soft-200 px-4 py-2 text-error-base"
            >
              Sign-out failed. Try again.
            </Typography>
          )}
          <div
            className="flex min-h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-stroke-soft-200 px-3 py-1.5"
            aria-label={tab === "reviews" ? "Review status filters" : "Account approval filters"}
          >
            {tab === "reviews"
              ? (["all", "published", "hidden", "deleted"] as const).map((value) => (
                  <AlignButton.Root
                    key={value}
                    size="xxsmall"
                    variant="neutral"
                    mode={status === value ? "lighter" : "ghost"}
                    className="gap-2 text-label-xs"
                    aria-pressed={status === value}
                    onClick={() => {
                      setStatus(value);
                      setOffset(0);
                      setSelectedId(null);
                    }}
                  >
                    <span className="capitalize">{value === "all" ? "All reviews" : value}</span>
                    <span className="text-text-sub-600 tabular-nums">
                      {reviews.data?.counts[value] ?? "—"}
                    </span>
                  </AlignButton.Root>
                ))
              : (["all", "pending", "approved"] as const).map((value) => (
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
                {current.isError ? (
                  <Typography role="alert" className="p-4">
                    Unable to load protected data. Refresh or sign in again.
                  </Typography>
                ) : current.isPending ? (
                  <Typography role="status" className="p-4">
                    Loading…
                  </Typography>
                ) : (
                  <>
                    <Tabs.Content value="reviews" className="outline-none">
                      <div className="hidden grid-cols-[minmax(150px,0.9fr)_minmax(0,2fr)_184px_160px] gap-4 border-b border-stroke-soft-200 bg-bg-white-0 px-4 py-2 text-label-xs text-text-strong-950 lg:sticky lg:top-0 lg:z-10 lg:grid">
                        <span>Lecturer / course</span>
                        <span>Review</span>
                        <span className="text-center">Ratings</span>
                        <span className="text-center">Actions</span>
                      </div>
                      {!reviewRows.length && (
                        <div className="flex min-h-64 flex-col items-center justify-center gap-2 px-4">
                          <RiChatCheckLine className="size-7 text-text-sub-600" />
                          <Typography variant="labelSmall">
                            {status === "all" ? "No lecturer reviews yet" : `No ${status} reviews`}
                          </Typography>
                          <Typography variant="caption" className="text-text-sub-600">
                            {status === "all"
                              ? "New public reviews will appear here for moderation."
                              : "Choose another status to inspect other reviews."}
                          </Typography>
                        </div>
                      )}
                      {reviewRows.slice(0, 50).map((review) => (
                        <AdminReviewRow
                          key={review.id}
                          review={review}
                          selected={selectedReview?.id === review.id}
                          onSelect={() => {
                            setSelectedId(review.id);
                            setInspectorOpen(true);
                          }}
                          onAction={confirmReview}
                        />
                      ))}
                    </Tabs.Content>
                    {manager && (
                      <Tabs.Content value="users" className="outline-none">
                        <AdminUserList
                          users={userRows}
                          identityId={identity.id}
                          selectedId={selectedUser?.id}
                          onSelect={(id) => {
                            setSelectedUserId(id);
                            setInspectorOpen(true);
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
                      </Tabs.Content>
                    )}
                  </>
                )}
              </div>
              {!current.isPending && !current.isError && pagination}
            </div>
            {tab === "reviews" && selectedReview && detailsVisible && (
              <ReviewInspector review={selectedReview} onAction={confirmReview} />
            )}
            {tab === "users" && manager && selectedUser && detailsVisible && (
              <UserAccessInspector
                key={selectedUser.id}
                user={selectedUser}
                identityId={identity.id}
                onAssign={confirmRole}
              />
            )}
          </div>
        </section>
      </Tabs.Root>
      <AlignModal.Root
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setConfirmation(null);
        }}
      >
        <AlignModal.Content className="p-5">
          <AlignModal.Title>
            Confirm {confirmation?.kind === "role" ? "role assignment" : confirmation?.input.action}
          </AlignModal.Title>
          <AlignModal.Description className="mt-2 pr-4">
            {confirmation?.label}.{" "}
            {confirmation?.kind === "role"
              ? `Assign ${confirmation.input.role}. This changes protected access on the next request.`
              : confirmation?.input.action === "delete"
                ? "Soft deletion removes this review from public view and cannot be undone here. It does not erase stored data."
                : confirmation?.input.action === "hide"
                  ? "Remove this review from public listings and scores."
                  : "Publish this review again and include it in public scores."}
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
                if (confirmation) mutation.mutate(confirmation);
              }}
            >
              {mutation.isPending ? "Saving…" : "Confirm"}
            </AlignFancyButton.Root>
          </div>
        </AlignModal.Content>
      </AlignModal.Root>
    </main>
  );
}
