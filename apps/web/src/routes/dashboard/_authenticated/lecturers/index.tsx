import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { canManageUsers } from "@g13/auth";
import { RiCloseLine, RiSearchLine, RiUserVoiceLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { Loading } from "@/ui/loading";
import { Typography } from "@/ui/typography";
import { AdminInspector, desktopInspectorQuery } from "../-components/AdminInspector";
import { useAdminLayout } from "../-components/AdminLayoutContext";
import { AdminPageHeader, DetailsToggleButton } from "../-components/AdminPageHeader";
import { AdminPagination } from "../-components/AdminPagination";
import { AdminTableHeader } from "../-components/AdminTable";
import { ConfirmActionModal } from "../-components/ConfirmActionModal";
import { ConfirmationChange } from "../-components/ConfirmationChange";
import { DashboardEmptyState } from "../-components/DashboardEmptyState";
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
  loader: async ({ context }) => {
    try {
      return await context.queryClient.fetchQuery(adminLecturersQuery());
    } catch (error) {
      if (error instanceof Response && (error.status === 401 || error.status === 403))
        throw redirect({ to: "/dashboard/login" });
      throw error;
    }
  },
  pendingComponent: () => (
    <div className="flex flex-1 items-center justify-center p-6">
      <Loading tone="neutral" />
    </div>
  ),
  component: AdminLecturersPage,
});

function AdminLecturersPage() {
  const initialData = Route.useLoaderData();
  const { identity } = initialData;
  const { detailsOpen, setDetailsOpen } = useAdminLayout();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<LecturerStatus>("active");
  const [query, setQuery] = useState("");
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
  const lecturersQuery = useQuery(adminLecturersQuery(offset, status));
  const counts = lecturersQuery.data?.counts ?? initialData.counts;
  const lecturerRows = lecturersQuery.data?.rows ?? [];
  const pageRows = lecturerRows.slice(0, 50);
  const needle = query.trim().toLowerCase();
  const visibleRows = needle
    ? pageRows.filter((row) => `${row.name} ${row.id}`.toLowerCase().includes(needle))
    : pageRows;
  const count = visibleRows.length;
  const total = needle ? visibleRows.length : counts[status];
  const selectedLecturer =
    visibleRows.find((lecturer) => lecturer.id === selectedId) ?? visibleRows[0];
  const detailsVisible =
    detailsOpen && !!selectedLecturer && !lecturersQuery.isPending && !lecturersQuery.isError;

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
        setOffset(0);
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

  return (
    <>
      <AdminPageHeader
        title="Lecturers"
        manager={canManageUsers(identity.role)}
        userName={identity.name}
        userImage={identity.image}
        action={
          <AlignFancyButton.Root size="xxsmall" onClick={openCreateModal}>
            Add lecturer
          </AlignFancyButton.Root>
        }
      />
      <div
        className="flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stroke-soft-200 px-3 py-1.5"
        aria-label="Lecturer status filters"
      >
        <div className="flex items-center gap-1 overflow-x-auto">
          {lecturerStatusSchema.options.map((value) => (
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
              <span>{value === "active" ? "Active" : "Deleted"}</span>
              <span className="text-text-sub-600 tabular-nums">{counts[value]}</span>
            </AlignButton.Root>
          ))}
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="relative flex flex-1 items-center sm:w-60">
            <RiSearchLine
              className="pointer-events-none absolute left-2.5 size-3.5 text-text-sub-600"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter lecturer name or slug…"
              aria-label="Filter lecturers"
              className="h-10 w-full appearance-none rounded-md border border-stroke-soft-200 bg-bg-white-0 pl-9 pr-8 text-base sm:h-7 sm:pl-8 sm:pr-7 sm:text-paragraph-xs [&::-webkit-search-cancel-button]:appearance-none text-text-strong-950 placeholder:text-text-sub-600 focus:border-stroke-strong-950 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear filter"
                className="absolute right-1.5 inline-flex size-5 items-center justify-center rounded text-text-sub-600 hover:text-text-strong-950"
              >
                <RiCloseLine className="size-3.5" />
              </button>
            )}
          </label>
          <DetailsToggleButton
            available={!!selectedLecturer}
            visible={detailsVisible}
            onToggle={() => setDetailsOpen((open) => !open)}
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg-white-0">
          {!lecturersQuery.isPending && !lecturersQuery.isError && (
            <AdminPagination
              count={count}
              offset={needle ? 0 : offset}
              total={total}
              label="lecturers"
              hasNext={!needle && lecturerRows.length > 50}
              onPrevious={() => setOffset((current) => Math.max(0, current - 50))}
              onNext={() => setOffset((current) => current + 50)}
            />
          )}
          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-white-0 ${count === 0 ? "flex flex-col" : ""}`}
          >
            {lecturersQuery.isError ? (
              <Typography role="alert" className="p-4">
                Could not load lecturers. Refresh or sign in again.
              </Typography>
            ) : lecturersQuery.isPending ? (
              <div className="flex h-full min-h-64 items-center justify-center p-6">
                <Loading tone="neutral" />
              </div>
            ) : (
              <>
                <AdminTableHeader
                  className={`hidden lg:sticky lg:top-0 lg:z-10 lg:grid ${lecturerTableColumns}`}
                >
                  <span>Lecturer</span>
                  <span className="text-right">Reviews</span>
                  <span className="text-right">Actions</span>
                </AdminTableHeader>
                {!count && (
                  <DashboardEmptyState
                    icon={<RiUserVoiceLine />}
                    title={
                      needle
                        ? "No matching lecturers"
                        : status === "active"
                          ? "No lecturers yet"
                          : "No deleted lecturers"
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
                      ) : status === "deleted" && counts.active > 0 ? (
                        <AlignButton.Root
                          size="small"
                          variant="neutral"
                          mode="stroke"
                          onClick={() => {
                            setStatus("active");
                            setOffset(0);
                            setSelectedId(null);
                          }}
                        >
                          View active lecturers
                        </AlignButton.Root>
                      ) : status === "active" ? (
                        <AlignFancyButton.Root size="small" onClick={openCreateModal}>
                          Add lecturer
                        </AlignFancyButton.Root>
                      ) : undefined
                    }
                  />
                )}
                {visibleRows.map((lecturer) => (
                  <AdminLecturerRow
                    key={lecturer.id}
                    lecturer={lecturer}
                    selected={selectedLecturer?.id === lecturer.id}
                    onSelect={() => {
                      setSelectedId(lecturer.id);
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
          title="Lecturer details"
          desktopOpen={detailsVisible}
          mobileOpen={mobileDetailsOpen}
          onMobileOpenChange={setMobileDetailsOpen}
        >
          {selectedLecturer && !lecturersQuery.isPending && !lecturersQuery.isError && (
            <LecturerInspector
              key={selectedLecturer.id}
              lecturer={selectedLecturer}
              onEdit={openEditModal}
              onLifecycle={confirmLifecycle}
            />
          )}
        </AdminInspector>
      </div>
      <LecturerFormModal
        open={formModal.open}
        lecturer={formModal.lecturer}
        pending={saveMutation.isPending}
        error={saveMutation.isError ? "Could not save lecturer. Refresh and try again." : undefined}
        onClose={() => setFormModal({ open: false, lecturer: null })}
        onSubmit={(values) => saveMutation.mutate({ lecturerId: formModal.lecturer?.id, values })}
      />
      <ConfirmActionModal
        open={confirmation !== null}
        title={confirmation?.input.action === "delete" ? "Confirm delete" : "Confirm restore"}
        description={
          <>
            <strong className="text-text-strong-950">{confirmation?.label}</strong>.{" "}
            {confirmation?.input.action === "delete"
              ? "This hides the lecturer from public listings and new review submissions. Existing reviews stay preserved and you can restore them anytime."
              : "This restores the lecturer to the public directory and makes them available for new review submissions again."}
          </>
        }
        confirmLabel={
          confirmation?.input.action === "delete" ? "Delete lecturer" : "Restore lecturer"
        }
        error={lifecycleMutation.isError ? "Update failed. Refresh and try again." : undefined}
        pending={lifecycleMutation.isPending}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation) lifecycleMutation.mutate(confirmation.input);
        }}
      >
        {confirmation && (
          <ConfirmationChange
            from={<RecordStatusBadge deleted={confirmation.input.action === "restore"} />}
            to={<RecordStatusBadge deleted={confirmation.input.action === "delete"} />}
          />
        )}
      </ConfirmActionModal>
    </>
  );
}
