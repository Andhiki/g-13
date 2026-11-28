import { AdminSearchHighlightScope } from "../-client/search-highlight";
import { useAdminList } from "../-client/useAdminList";
import { adminListSearchSchema } from "../-shared/admin-search";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { RiUserVoiceLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { Typography } from "@/ui/typography";
import { AdminFilterBar, AdminSearchInput } from "../-components/AdminFilterBar";
import { AdminInspectorLayout, desktopInspectorQuery } from "../-components/AdminInspector";
import { useAdminLayout } from "../-components/AdminLayoutContext";
import { AdminPageHeader, DetailsToggleButton } from "../-components/AdminPageHeader";
import { AdminPagination } from "../-components/AdminPagination";
import { AdminTableHeader } from "../-components/AdminTable";
import { ConfirmActionModal } from "../-components/ConfirmActionModal";
import { ConfirmationChange } from "../-components/ConfirmationChange";
import { DashboardEmptyState } from "../-components/DashboardEmptyState";
import { DashboardPending, DashboardRoutePending } from "../-components/DashboardPending";
import { RecordStatusBadge } from "../-components/RecordStatusBadge";
import { adminLecturersQuery } from "./-client/queries";
import {
  AdminLecturerRow,
  lecturerTableColumns,
  type AdminLecturer,
} from "./-components/AdminLecturerRow";
import { LecturerFormModal } from "./-components/LecturerFormModal";
import { LecturerInspector } from "./-components/LecturerInspector";
import {
  changeAdminLecturerLifecycle,
  createAdminLecturer,
  updateAdminLecturer,
} from "./-server/handler";
import {
  lecturerStatusSchema,
  type LecturerFieldsInput,
  type LecturerLifecycleInput,
  type LecturerStatus,
} from "./-shared/schemas";

export const Route = createFileRoute("/dashboard/_authenticated/lecturers/")({
  validateSearch: adminListSearchSchema,
  loader: async ({ context }) => {
    try {
      return await context.queryClient.fetchQuery(adminLecturersQuery());
    } catch (error) {
      if (error instanceof Response && (error.status === 401 || error.status === 403))
        throw redirect({ to: "/dashboard/login" });
      throw error;
    }
  },
  pendingComponent: DashboardRoutePending,
  component: AdminLecturersPage,
});

function lecturerEmptyAction({
  needle,
  status,
  activeCount,
  onClearSearch,
  onViewActive,
  onCreate,
}: {
  needle: string;
  status: LecturerStatus;
  activeCount: number;
  onClearSearch: () => void;
  onViewActive: () => void;
  onCreate: () => void;
}) {
  if (needle) {
    return (
      <AlignButton.Root size="small" variant="neutral" mode="stroke" onClick={onClearSearch}>
        Clear search
      </AlignButton.Root>
    );
  }
  if (status === "deleted" && activeCount > 0) {
    return (
      <AlignButton.Root size="small" variant="neutral" mode="stroke" onClick={onViewActive}>
        View active lecturers
      </AlignButton.Root>
    );
  }
  if (status === "active") {
    return (
      <AlignFancyButton.Root size="small" onClick={onCreate}>
        Add lecturer
      </AlignFancyButton.Root>
    );
  }
  return undefined;
}

function LecturersListBody({
  queryState,
  visibleRows,
  needle,
  status,
  activeCount,
  selectedId,
  onClearSearch,
  onViewActive,
  onCreate,
  onSelect,
  onEdit,
  onLifecycle,
}: {
  queryState: { isError: boolean; isPending: boolean };
  visibleRows: AdminLecturer[];
  needle: string;
  status: LecturerStatus;
  activeCount: number;
  selectedId?: string;
  onClearSearch: () => void;
  onViewActive: () => void;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onEdit: (lecturer: AdminLecturer) => void;
  onLifecycle: (input: LecturerLifecycleInput, label: string) => void;
}) {
  if (queryState.isError) {
    return (
      <div className="p-4">
        <Typography role="alert">Could not load lecturers. Refresh or sign in again.</Typography>
      </div>
    );
  }
  if (queryState.isPending) return <DashboardPending />;
  const emptyTitle = needle
    ? "No matching lecturers"
    : status === "active"
      ? "No lecturers yet"
      : "No deleted lecturers";
  const emptyDescription = needle
    ? "Try another search term or clear the search to see catalogue lecturers."
    : status === "active"
      ? "Lecturers in the catalogue can be selected on public review pages. Add a lecturer if someone is missing."
      : "Deleted lecturers are kept here so they can be restored without removing their review history.";

  return (
    <>
      <AdminTableHeader
        className={`hidden lg:sticky lg:top-0 lg:z-10 lg:grid ${lecturerTableColumns}`}
      >
        <span>Lecturer</span>
        <span className="text-right">Reviews</span>
        <span className="text-right">Actions</span>
      </AdminTableHeader>
      {visibleRows.length === 0 && (
        <DashboardEmptyState
          icon={<RiUserVoiceLine />}
          title={emptyTitle}
          description={emptyDescription}
          action={lecturerEmptyAction({
            needle,
            status,
            activeCount,
            onClearSearch,
            onViewActive,
            onCreate,
          })}
        />
      )}
      <AdminSearchHighlightScope needle={needle}>
        {visibleRows.map((lecturer) => (
          <AdminLecturerRow
            key={lecturer.id}
            lecturer={lecturer}
            selected={selectedId === lecturer.id}
            onSelect={() => onSelect(lecturer.id)}
            onEdit={onEdit}
            onLifecycle={onLifecycle}
          />
        ))}
      </AdminSearchHighlightScope>
    </>
  );
}

function LecturerLifecycleModal({
  confirmation,
  isError,
  isPending,
  onClose,
  onConfirm,
}: {
  confirmation: { input: LecturerLifecycleInput; label: string } | null;
  isError: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const deleting = confirmation?.input.action === "delete";
  const summary = deleting
    ? "This hides the lecturer from public listings and new review submissions. Existing reviews stay preserved and you can restore them anytime."
    : "This restores the lecturer to the public directory and makes them available for new review submissions again.";

  return (
    <ConfirmActionModal
      open={confirmation !== null}
      destructive={deleting}
      title={deleting ? "Confirm delete" : "Confirm restore"}
      description={
        <>
          <strong className="text-text-strong-950">{confirmation?.label}</strong>. {summary}
        </>
      }
      confirmLabel={deleting ? "Delete lecturer" : "Restore lecturer"}
      error={isError ? "Update failed. Refresh and try again." : undefined}
      pending={isPending}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      {confirmation && (
        <ConfirmationChange
          from={<RecordStatusBadge deleted={confirmation.input.action === "restore"} />}
          to={<RecordStatusBadge deleted={deleting} />}
        />
      )}
    </ConfirmActionModal>
  );
}

function LecturersContent({
  queryState,
  visibleRows,
  count,
  offset,
  total,
  hasNext,
  needle,
  status,
  activeCount,
  selectedLecturer,
  detailsVisible,
  mobileDetailsOpen,
  onMobileDetailsOpenChange,
  onPreviousPage,
  onNextPage,
  onClearSearch,
  onViewActive,
  onCreate,
  onSelect,
  onEdit,
  onLifecycle,
}: {
  queryState: { isError: boolean; isPending: boolean };
  visibleRows: AdminLecturer[];
  count: number;
  offset: number;
  total: number;
  hasNext: boolean;
  needle: string;
  status: LecturerStatus;
  activeCount: number;
  selectedLecturer: AdminLecturer | undefined;
  detailsVisible: boolean;
  mobileDetailsOpen: boolean;
  onMobileDetailsOpenChange: (open: boolean) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onClearSearch: () => void;
  onViewActive: () => void;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onEdit: (lecturer: AdminLecturer) => void;
  onLifecycle: (input: LecturerLifecycleInput, label: string) => void;
}) {
  return (
    <AdminInspectorLayout
      title="Lecturer details"
      desktopOpen={detailsVisible}
      mobileOpen={mobileDetailsOpen}
      onMobileOpenChange={onMobileDetailsOpenChange}
      details={
        selectedLecturer &&
        !queryState.isPending &&
        !queryState.isError && (
          <LecturerInspector
            key={selectedLecturer.id}
            lecturer={selectedLecturer}
            onEdit={onEdit}
            onLifecycle={onLifecycle}
          />
        )
      }
    >
      {!queryState.isPending && !queryState.isError && (
        <AdminPagination
          count={count}
          offset={offset}
          total={total}
          label="lecturers"
          hasNext={hasNext}
          onPrevious={onPreviousPage}
          onNext={onNextPage}
        />
      )}
      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-white-0 ${count === 0 ? "flex flex-col" : ""}`}
      >
        <LecturersListBody
          queryState={queryState}
          visibleRows={visibleRows}
          needle={needle}
          status={status}
          activeCount={activeCount}
          selectedId={selectedLecturer?.id}
          onClearSearch={onClearSearch}
          onViewActive={onViewActive}
          onCreate={onCreate}
          onSelect={onSelect}
          onEdit={onEdit}
          onLifecycle={onLifecycle}
        />
      </div>
    </AdminInspectorLayout>
  );
}

function AdminLecturersPage() {
  const initialData = Route.useLoaderData();
  const { detailsOpen, setDetailsOpen } = useAdminLayout();
  const {
    query,
    setQuery,
    needle,
    offset,
    status,
    setStatus,
    counts,
    listState,
    rows: visibleRows,
    total,
    page,
  } = useAdminList("active", adminLecturersQuery, initialData.counts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [formModal, setFormModal] = useState<{ open: boolean; lecturer: AdminLecturer | null }>({
    open: false,
    lecturer: null,
  });
  const [confirmation, setConfirmation] = useState<{
    input: LecturerLifecycleInput;
    label: string;
  } | null>(null);

  const queryClient = useQueryClient();

  const count = visibleRows.length;
  const selectedLecturer =
    visibleRows.find((lecturer) => lecturer.id === selectedId) ?? visibleRows[0];
  const detailsVisible =
    detailsOpen && !!selectedLecturer && !listState.isPending && !listState.isError;

  async function invalidateLecturerQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin"] }),
      queryClient.invalidateQueries({ queryKey: ["lecturer-reviews"] }),
    ]);
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: { lecturerId?: string; values: LecturerFieldsInput }) => {
      if (payload.lecturerId) {
        const updated = await updateAdminLecturer({
          data: { lecturerId: payload.lecturerId, ...payload.values },
        });
        return { id: updated.lecturerId, created: false };
      }
      const created = await createAdminLecturer({ data: payload.values });
      return { id: created.id, created: true };
    },
    onSuccess: async (result) => {
      await invalidateLecturerQueries();
      setFormModal({ open: false, lecturer: null });
      if (result.created) {
        setStatus("active");
        setSelectedId(result.id);
      }
    },
  });

  const lifecycleMutation = useMutation({
    mutationFn: (input: LecturerLifecycleInput) => changeAdminLecturerLifecycle({ data: input }),
    onSuccess: async () => {
      await invalidateLecturerQueries();
      setConfirmation(null);
    },
  });

  function openCreateModal() {
    saveMutation.reset();
    setFormModal({ open: true, lecturer: null });
  }

  function openEditModal(lecturer: AdminLecturer) {
    saveMutation.reset();
    setFormModal({ open: true, lecturer });
  }

  function confirmLifecycle(input: LecturerLifecycleInput, label: string) {
    lifecycleMutation.reset();
    setConfirmation({ input, label });
  }

  const searchAndDetails = (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <AdminSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Filter lecturer name or slug…"
        ariaLabel="Filter lecturers"
      />
      <DetailsToggleButton
        available={!!selectedLecturer}
        visible={detailsVisible}
        onToggle={() => setDetailsOpen((open) => !open)}
      />
    </div>
  );

  return (
    <>
      <AdminPageHeader
        title="Lecturers"
        action={
          <AlignFancyButton.Root size="xxsmall" onClick={openCreateModal}>
            Add lecturer
          </AlignFancyButton.Root>
        }
      />
      <AdminFilterBar
        ariaLabel="Lecturer status filters"
        tabs={lecturerStatusSchema.options.map((value) => ({
          value,
          label: value === "active" ? "Active" : "Deleted",
          count: counts[value],
        }))}
        activeTab={status}
        onTabChange={(value) => {
          setStatus(value);
          setSelectedId(null);
        }}
      >
        {searchAndDetails}
      </AdminFilterBar>
      <LecturersContent
        queryState={listState}
        visibleRows={visibleRows}
        count={count}
        offset={offset}
        total={total}
        needle={needle}
        status={status}
        activeCount={counts.active}
        selectedLecturer={selectedLecturer}
        detailsVisible={detailsVisible}
        mobileDetailsOpen={mobileDetailsOpen}
        onMobileDetailsOpenChange={setMobileDetailsOpen}
        hasNext={page.hasNext}
        onPreviousPage={page.previous}
        onNextPage={page.next}
        onClearSearch={() => setQuery("")}
        onViewActive={() => {
          setStatus("active");
          setSelectedId(null);
        }}
        onCreate={openCreateModal}
        onSelect={(id) => {
          setSelectedId(id);
          setDetailsOpen(true);
          setMobileDetailsOpen(!window.matchMedia(desktopInspectorQuery).matches);
        }}
        onEdit={openEditModal}
        onLifecycle={confirmLifecycle}
      />
      <LecturerFormModal
        open={formModal.open}
        lecturer={formModal.lecturer}
        pending={saveMutation.isPending}
        error={saveMutation.isError ? "Could not save lecturer. Refresh and try again." : undefined}
        onClose={() => setFormModal({ open: false, lecturer: null })}
        onSubmit={(values) => saveMutation.mutate({ lecturerId: formModal.lecturer?.id, values })}
      />
      <LecturerLifecycleModal
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
