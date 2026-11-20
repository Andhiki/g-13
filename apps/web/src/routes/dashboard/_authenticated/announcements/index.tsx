import { RiMegaphoneLine } from "@remixicon/react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { canManageUsers } from "@g13/auth";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { Typography } from "@/ui/typography";
import { AdminFilterBar, AdminSearchInput } from "../-components/AdminFilterBar";
import { AdminInspector, desktopInspectorQuery } from "../-components/AdminInspector";
import { useAdminLayout } from "../-components/AdminLayoutContext";
import { AdminPageHeader, DetailsToggleButton } from "../-components/AdminPageHeader";
import { AdminPagination } from "../-components/AdminPagination";
import { AdminTableHeader } from "../-components/AdminTable";
import { ConfirmActionModal } from "../-components/ConfirmActionModal";
import { DashboardEmptyState } from "../-components/DashboardEmptyState";
import { DashboardPending, DashboardRoutePending } from "../-components/DashboardPending";
import { announcementTableColumns } from "./-components/AdminAnnouncementRow";
import { adminAnnouncementsQuery } from "./-client/queries";
import { AdminAnnouncementRow, type AdminAnnouncement } from "./-components/AdminAnnouncementRow";
import { AnnouncementFormModal } from "./-components/AnnouncementFormModal";
import { AnnouncementInspector } from "./-components/AnnouncementInspector";
import {
  changeAdminAnnouncementLifecycle,
  createAdminAnnouncement,
  updateAdminAnnouncement,
} from "./-server/handler";
import {
  announcementStatusSchema,
  type AnnouncementFieldsInput,
  type AnnouncementLifecycleInput,
  type AnnouncementStatus,
} from "./-shared/schemas";

const statusLabels: Record<AnnouncementStatus, string> = {
  live: "Live",
  scheduled: "Scheduled",
  expired: "Expired",
  disabled: "Disabled",
};

const emptyStateCopy: Record<AnnouncementStatus, { title: string; description: string }> = {
  live: {
    title: "No live announcements",
    description:
      "Announcements shown above the navbar are managed here. Add one to tell visitors about new features or schedule changes.",
  },
  scheduled: {
    title: "No scheduled announcements",
    description: "Announcements with a future start date appear here until they go live.",
  },
  expired: {
    title: "No expired announcements",
    description: "Announcements whose expiry date has passed are kept here for reference.",
  },
  disabled: {
    title: "No disabled announcements",
    description:
      "Disabled announcements are hidden from the site while keeping their content and schedule for later.",
  },
};

export const Route = createFileRoute("/dashboard/_authenticated/announcements/")({
  loader: async ({ context }) => {
    try {
      return await context.queryClient.fetchQuery(adminAnnouncementsQuery());
    } catch (error) {
      if (error instanceof Response && error.status === 401)
        throw redirect({ to: "/dashboard/login" });
      if (error instanceof Response && error.status === 403)
        throw redirect({ to: "/dashboard/lecturer-reviews" });
      throw error;
    }
  },
  pendingComponent: DashboardRoutePending,
  component: AdminAnnouncementsPage,
});

function AdminAnnouncementsPage() {
  const initialData = Route.useLoaderData();
  const { identity } = initialData;
  const { detailsOpen, setDetailsOpen } = useAdminLayout();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<AnnouncementStatus>("live");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [formModal, setFormModal] = useState<{
    open: boolean;
    announcement: AdminAnnouncement | null;
  }>({
    open: false,
    announcement: null,
  });
  const [confirmation, setConfirmation] = useState<{
    input: AnnouncementLifecycleInput;
    label: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const announcementsQuery = useQuery(adminAnnouncementsQuery(offset, status));
  const counts = announcementsQuery.data?.counts ?? initialData.counts;
  const announcementRows = announcementsQuery.data?.rows ?? [];
  const pageRows = announcementRows.slice(0, 50);
  const needle = query.trim().toLowerCase();
  const visibleRows = needle
    ? pageRows.filter((row) =>
        `${row.slug} ${row.titleId} ${row.titleEn}`.toLowerCase().includes(needle),
      )
    : pageRows;
  const count = visibleRows.length;
  const total = needle ? visibleRows.length : counts[status];
  const selectedAnnouncement =
    visibleRows.find((announcement) => announcement.id === selectedId) ?? visibleRows[0];
  const detailsVisible =
    detailsOpen &&
    !!selectedAnnouncement &&
    !announcementsQuery.isPending &&
    !announcementsQuery.isError;

  async function invalidateAnnouncementQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin"] }),
      queryClient.invalidateQueries({ queryKey: ["announcements"] }),
    ]);
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: { announcementId?: string; values: AnnouncementFieldsInput }) => {
      if (payload.announcementId) {
        const updated = await updateAdminAnnouncement({
          data: { announcementId: payload.announcementId, ...payload.values },
        });
        return { id: updated.announcementId, created: false };
      }
      const created = await createAdminAnnouncement({ data: payload.values });
      return { id: created.id, created: true };
    },
    onSuccess: async (result) => {
      await invalidateAnnouncementQueries();
      setFormModal({ open: false, announcement: null });
      if (result.created) {
        setStatus("live");
        setOffset(0);
        setSelectedId(result.id);
      }
    },
  });

  const lifecycleMutation = useMutation({
    mutationFn: (input: AnnouncementLifecycleInput) =>
      changeAdminAnnouncementLifecycle({ data: input }),
    onSuccess: async () => {
      await invalidateAnnouncementQueries();
      setConfirmation(null);
    },
  });

  function openCreateModal() {
    saveMutation.reset();
    setFormModal({ open: true, announcement: null });
  }

  function openEditModal(announcement: AdminAnnouncement) {
    saveMutation.reset();
    setFormModal({ open: true, announcement });
  }

  function confirmLifecycle(input: AnnouncementLifecycleInput, label: string) {
    lifecycleMutation.reset();
    setConfirmation({ input, label });
  }

  const confirmCopy = confirmation
    ? confirmation.input.action === "delete"
      ? {
          title: "Confirm delete",
          description:
            "This permanently removes the announcement from the site and the admin list.",
          confirmLabel: "Delete announcement",
        }
      : confirmation.input.action === "disable"
        ? {
            title: "Confirm disable",
            description:
              "This hides the announcement from the site while keeping its content and schedule, so you can re-enable it later.",
            confirmLabel: "Disable announcement",
          }
        : {
            title: "Confirm enable",
            description:
              "This makes the announcement eligible to appear above the navbar within its schedule.",
            confirmLabel: "Enable announcement",
          }
    : null;

  return (
    <>
      <AdminPageHeader
        title="Announcements"
        manager={canManageUsers(identity.role)}
        userName={identity.name}
        userEmail={identity.email}
        userImage={identity.image}
        action={
          <AlignFancyButton.Root size="xxsmall" onClick={openCreateModal}>
            Add announcement
          </AlignFancyButton.Root>
        }
      />
      <AdminFilterBar
        ariaLabel="Announcement status filters"
        tabs={announcementStatusSchema.options.map((value) => ({
          value,
          label: statusLabels[value],
          count: counts[value],
        }))}
        activeTab={status}
        onTabChange={(value) => {
          setStatus(value);
          setOffset(0);
          setSelectedId(null);
        }}
      >
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <AdminSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Filter slug or title…"
            ariaLabel="Filter announcements"
          />
          <DetailsToggleButton
            available={!!selectedAnnouncement}
            visible={detailsVisible}
            onToggle={() => setDetailsOpen((open) => !open)}
          />
        </div>
      </AdminFilterBar>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg-white-0">
          {!announcementsQuery.isPending && !announcementsQuery.isError && (
            <AdminPagination
              count={count}
              offset={needle ? 0 : offset}
              total={total}
              label="announcements"
              hasNext={!needle && announcementRows.length > 50}
              onPrevious={() => setOffset((current) => Math.max(0, current - 50))}
              onNext={() => setOffset((current) => current + 50)}
            />
          )}
          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-white-0 ${count === 0 ? "flex flex-col" : ""}`}
          >
            {announcementsQuery.isError ? (
              <Typography role="alert" className="p-4">
                Could not load announcements. Refresh or sign in again.
              </Typography>
            ) : announcementsQuery.isPending ? (
              <DashboardPending />
            ) : (
              <>
                <AdminTableHeader
                  className={`hidden lg:sticky lg:top-0 lg:z-10 lg:grid ${announcementTableColumns}`}
                >
                  <span>Announcement</span>
                  <span>Schedule</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </AdminTableHeader>
                {!count && (
                  <DashboardEmptyState
                    icon={<RiMegaphoneLine />}
                    title={needle ? "No matching announcements" : emptyStateCopy[status].title}
                    description={
                      needle
                        ? "Try another search term or clear the search to see announcements."
                        : emptyStateCopy[status].description
                    }
                    action={
                      needle ? (
                        <AlignButton.Root
                          size="small"
                          variant="neutral"
                          mode="stroke"
                          onClick={() => setQuery("")}
                        >
                          Clear search
                        </AlignButton.Root>
                      ) : status === "live" ? (
                        <AlignFancyButton.Root size="small" onClick={openCreateModal}>
                          Add announcement
                        </AlignFancyButton.Root>
                      ) : undefined
                    }
                  />
                )}
                {visibleRows.map((announcement) => (
                  <AdminAnnouncementRow
                    key={announcement.id}
                    announcement={announcement}
                    selected={selectedAnnouncement?.id === announcement.id}
                    onSelect={() => {
                      setSelectedId(announcement.id);
                      setDetailsOpen(true);
                      setMobileDetailsOpen(!window.matchMedia(desktopInspectorQuery).matches);
                    }}
                    onEdit={openEditModal}
                    onLifecycle={confirmLifecycle}
                  />
                ))}
              </>
            )}
          </div>
        </div>
        <AdminInspector
          title="Announcement details"
          desktopOpen={detailsVisible}
          mobileOpen={mobileDetailsOpen}
          onMobileOpenChange={setMobileDetailsOpen}
        >
          {selectedAnnouncement && !announcementsQuery.isPending && !announcementsQuery.isError && (
            <AnnouncementInspector
              key={selectedAnnouncement.id}
              announcement={selectedAnnouncement}
              onEdit={openEditModal}
              onLifecycle={confirmLifecycle}
            />
          )}
        </AdminInspector>
      </div>
      <AnnouncementFormModal
        open={formModal.open}
        announcement={formModal.announcement}
        pending={saveMutation.isPending}
        error={
          saveMutation.isError ? "Could not save announcement. Refresh and try again." : undefined
        }
        onClose={() => setFormModal({ open: false, announcement: null })}
        onSubmit={(values) =>
          saveMutation.mutate({ announcementId: formModal.announcement?.id, values })
        }
      />
      <ConfirmActionModal
        open={confirmation !== null}
        title={confirmCopy?.title ?? ""}
        description={
          <>
            <strong className="text-text-strong-950">{confirmation?.label}</strong>.{" "}
            {confirmCopy?.description}
          </>
        }
        confirmLabel={confirmCopy?.confirmLabel ?? ""}
        error={lifecycleMutation.isError ? "Update failed. Refresh and try again." : undefined}
        pending={lifecycleMutation.isPending}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation) lifecycleMutation.mutate(confirmation.input);
        }}
      />
    </>
  );
}
