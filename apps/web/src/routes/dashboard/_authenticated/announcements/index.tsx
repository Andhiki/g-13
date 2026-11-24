import { RiMegaphoneLine } from "@remixicon/react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
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
import { announcementStatusLabel } from "./-shared/status";

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

const CONFIRM_COPY: Record<
  AnnouncementLifecycleInput["action"],
  { title: string; description: string; confirmLabel: string }
> = {
  delete: {
    title: "Confirm delete",
    description: "This permanently removes the announcement from the site and the admin list.",
    confirmLabel: "Delete announcement",
  },
  disable: {
    title: "Confirm disable",
    description:
      "This hides the announcement from the site while keeping its content and schedule, so you can re-enable it later.",
    confirmLabel: "Disable announcement",
  },
  enable: {
    title: "Confirm enable",
    description:
      "This makes the announcement eligible to appear above the navbar within its schedule.",
    confirmLabel: "Enable announcement",
  },
};

function AnnouncementsListBody({
  queryState,
  visibleRows,
  needle,
  status,
  selectedId,
  onClearSearch,
  onOpenCreate,
  onSelect,
  onEdit,
  onLifecycle,
}: {
  queryState: { isError: boolean; isPending: boolean };
  visibleRows: AdminAnnouncement[];
  needle: string;
  status: AnnouncementStatus;
  selectedId?: string;
  onClearSearch: () => void;
  onOpenCreate: () => void;
  onSelect: (id: string) => void;
  onEdit: (announcement: AdminAnnouncement) => void;
  onLifecycle: (input: AnnouncementLifecycleInput, label: string) => void;
}) {
  if (queryState.isError) {
    return (
      <div className="p-4">
        <Typography role="alert">
          Could not load announcements. Refresh or sign in again.
        </Typography>
      </div>
    );
  }
  if (queryState.isPending) return <DashboardPending />;
  const emptyAction = needle ? (
    <AlignButton.Root size="small" variant="neutral" mode="stroke" onClick={onClearSearch}>
      Clear search
    </AlignButton.Root>
  ) : status === "live" ? (
    <AlignFancyButton.Root size="small" onClick={onOpenCreate}>
      Add announcement
    </AlignFancyButton.Root>
  ) : undefined;

  return (
    <>
      <AdminTableHeader
        className={`hidden lg:sticky lg:top-0 lg:z-10 lg:grid ${announcementTableColumns}`}
      >
        <span>Announcement</span>
        <span>Schedule</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </AdminTableHeader>
      {visibleRows.length === 0 && (
        <DashboardEmptyState
          icon={<RiMegaphoneLine />}
          title={needle ? "No matching announcements" : emptyStateCopy[status].title}
          description={
            needle
              ? "Try another search term or clear the search to see announcements."
              : emptyStateCopy[status].description
          }
          action={emptyAction}
        />
      )}
      {visibleRows.map((announcement) => (
        <AdminAnnouncementRow
          key={announcement.id}
          announcement={announcement}
          selected={selectedId === announcement.id}
          onSelect={() => onSelect(announcement.id)}
          onEdit={onEdit}
          onLifecycle={onLifecycle}
        />
      ))}
    </>
  );
}

function AnnouncementsContent({
  queryState,
  visibleRows,
  count,
  offset,
  total,
  hasNext,
  needle,
  status,
  selectedAnnouncement,
  detailsVisible,
  mobileDetailsOpen,
  onMobileDetailsOpenChange,
  onPreviousPage,
  onNextPage,
  onClearSearch,
  onOpenCreate,
  onSelect,
  onEdit,
  onLifecycle,
}: {
  queryState: { isError: boolean; isPending: boolean };
  visibleRows: AdminAnnouncement[];
  count: number;
  offset: number;
  total: number;
  hasNext: boolean;
  needle: string;
  status: AnnouncementStatus;
  selectedAnnouncement: AdminAnnouncement | undefined;
  detailsVisible: boolean;
  mobileDetailsOpen: boolean;
  onMobileDetailsOpenChange: (open: boolean) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onClearSearch: () => void;
  onOpenCreate: () => void;
  onSelect: (id: string) => void;
  onEdit: (announcement: AdminAnnouncement) => void;
  onLifecycle: (input: AnnouncementLifecycleInput, label: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg-white-0">
        {!queryState.isPending && !queryState.isError && (
          <AdminPagination
            count={count}
            offset={needle ? 0 : offset}
            total={total}
            label="announcements"
            hasNext={hasNext}
            onPrevious={onPreviousPage}
            onNext={onNextPage}
          />
        )}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-white-0 ${count === 0 ? "flex flex-col" : ""}`}
        >
          <AnnouncementsListBody
            queryState={queryState}
            visibleRows={visibleRows}
            needle={needle}
            status={status}
            selectedId={selectedAnnouncement?.id}
            onClearSearch={onClearSearch}
            onOpenCreate={onOpenCreate}
            onSelect={onSelect}
            onEdit={onEdit}
            onLifecycle={onLifecycle}
          />
        </div>
      </div>
      <AdminInspector
        title="Announcement details"
        desktopOpen={detailsVisible}
        mobileOpen={mobileDetailsOpen}
        onMobileOpenChange={onMobileDetailsOpenChange}
      >
        {selectedAnnouncement && !queryState.isPending && !queryState.isError && (
          <AnnouncementInspector
            key={selectedAnnouncement.id}
            announcement={selectedAnnouncement}
            onEdit={onEdit}
            onLifecycle={onLifecycle}
          />
        )}
      </AdminInspector>
    </div>
  );
}

function AnnouncementLifecycleModal({
  confirmation,
  isError,
  isPending,
  onClose,
  onConfirm,
}: {
  confirmation: { input: AnnouncementLifecycleInput; label: string } | null;
  isError: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const confirmCopy = confirmation ? CONFIRM_COPY[confirmation.input.action] : null;
  const description = (
    <span>
      <strong className="text-text-strong-950">{confirmation?.label}</strong>.{" "}
      {confirmCopy?.description}
    </span>
  );

  return (
    <ConfirmActionModal
      open={confirmation !== null}
      destructive={confirmation?.input.action === "delete"}
      title={confirmCopy?.title ?? ""}
      description={description}
      confirmLabel={confirmCopy?.confirmLabel ?? ""}
      error={isError ? "Update failed. Refresh and try again." : undefined}
      pending={isPending}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function AdminAnnouncementsPage() {
  const initialData = Route.useLoaderData();
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
        `${row.id} ${row.titleId} ${row.titleEn}`.toLowerCase().includes(needle),
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

  const searchAndDetails = (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <AdminSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Filter announcement or title…"
        ariaLabel="Filter announcements"
      />
      <DetailsToggleButton
        available={!!selectedAnnouncement}
        visible={detailsVisible}
        onToggle={() => setDetailsOpen((open) => !open)}
      />
    </div>
  );

  return (
    <>
      <AdminPageHeader
        title="Announcements"
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
          label: announcementStatusLabel(value),
          count: counts[value],
        }))}
        activeTab={status}
        onTabChange={(value) => {
          setStatus(value);
          setOffset(0);
          setSelectedId(null);
        }}
      >
        {searchAndDetails}
      </AdminFilterBar>
      <AnnouncementsContent
        queryState={announcementsQuery}
        visibleRows={visibleRows}
        count={count}
        offset={offset}
        total={total}
        hasNext={!needle && announcementRows.length > 50}
        needle={needle}
        status={status}
        selectedAnnouncement={selectedAnnouncement}
        detailsVisible={detailsVisible}
        mobileDetailsOpen={mobileDetailsOpen}
        onMobileDetailsOpenChange={setMobileDetailsOpen}
        onPreviousPage={() => setOffset((current) => Math.max(0, current - 50))}
        onNextPage={() => setOffset((current) => current + 50)}
        onClearSearch={() => setQuery("")}
        onOpenCreate={openCreateModal}
        onSelect={(id) => {
          setSelectedId(id);
          setDetailsOpen(true);
          setMobileDetailsOpen(!window.matchMedia(desktopInspectorQuery).matches);
        }}
        onEdit={openEditModal}
        onLifecycle={confirmLifecycle}
      />
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
      <AnnouncementLifecycleModal
        confirmation={confirmation}
        isError={lifecycleMutation.isError}
        isPending={lifecycleMutation.isPending}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation) lifecycleMutation.mutate(confirmation.input);
        }}
      />
    </>
  );
}
