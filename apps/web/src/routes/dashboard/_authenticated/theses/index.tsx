import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { canManageUsers } from "@g13/auth";
import { RiFileTextLine } from "@remixicon/react";
import { AlignButton } from "@/ui/button";
import { AlignFancyButton } from "@/ui/fancy-button";
import { Typography } from "@/ui/typography";
import { AdminFilterBar, AdminSearchInput } from "../-components/AdminFilterBar";
import { AdminPageHeader } from "../-components/AdminPageHeader";
import { AdminPagination } from "../-components/AdminPagination";
import { AdminTableHeader } from "../-components/AdminTable";
import { DashboardEmptyState } from "../-components/DashboardEmptyState";
import { DashboardPending, DashboardRoutePending } from "../-components/DashboardPending";
import { adminThesesQuery } from "./-client/queries";
import { AdminThesisRow, thesisTableColumns, type AdminThesis } from "./-components/AdminThesisRow";
import { ThesisFormModal } from "./-components/ThesisFormModal";
import { ThesisLifecycleModal, type ThesisConfirmation } from "./-components/ThesisLifecycleModal";
import {
  changeAdminThesisLifecycle,
  createAdminThesis,
  updateAdminThesis,
} from "./-server/handler";
import {
  thesisStatusFilterSchema,
  type CreateThesisInput,
  type ThesisLifecycleInput,
  type ThesisStatusFilter,
} from "./-shared/schemas";

export const Route = createFileRoute("/dashboard/_authenticated/theses/")({
  loader: async ({ context }) => {
    try {
      return await context.queryClient.fetchQuery(adminThesesQuery());
    } catch (error) {
      if (error instanceof Response && (error.status === 401 || error.status === 403))
        throw redirect({ to: "/dashboard/login" });
      throw error;
    }
  },
  pendingComponent: DashboardRoutePending,
  component: AdminThesesPage,
});

const statusLabels: Record<ThesisStatusFilter, string> = {
  draft: "Draft",
  published: "Published",
  hidden: "Hidden",
  deleted: "Deleted",
};

function emptyTitle(needle: string, status: ThesisStatusFilter): string {
  if (needle) return "No matching theses";
  if (status === "draft") return "No draft theses";
  return `No ${statusLabels[status].toLowerCase()} theses`;
}

function emptyDescription(needle: string, status: ThesisStatusFilter): string {
  if (needle) return "Try another search term.";
  if (status === "draft") {
    return "New theses start as drafts.";
  }
  if (status === "published") {
    return "Publish a draft to list it in the public directory.";
  }
  if (status === "hidden") {
    return "You can publish hidden theses again.";
  }
  return "Restore a deleted thesis to edit it as a draft.";
}

function ThesesListBody({
  queryState,
  visibleRows,
  needle,
  status,
  onClearSearch,
  onViewDrafts,
  onCreate,
  onEdit,
  onAction,
}: {
  queryState: { isError: boolean; isPending: boolean };
  visibleRows: AdminThesis[];
  needle: string;
  status: ThesisStatusFilter;
  onClearSearch: () => void;
  onViewDrafts: () => void;
  onCreate: () => void;
  onEdit: (thesis: AdminThesis) => void;
  onAction: (thesis: AdminThesis, action: ThesisLifecycleInput["action"]) => void;
}) {
  if (queryState.isError) {
    return (
      <div className="p-4">
        <Typography role="alert">Could not load theses. Refresh or sign in again.</Typography>
      </div>
    );
  }
  if (queryState.isPending) return <DashboardPending />;

  return (
    <>
      <AdminTableHeader
        className={`hidden lg:sticky lg:top-0 lg:z-10 lg:grid ${thesisTableColumns}`}
      >
        <span>Thesis</span>
        <span>Status</span>
        <span className="text-right">Year</span>
        <span className="text-right">Actions</span>
      </AdminTableHeader>
      {visibleRows.length === 0 && (
        <DashboardEmptyState
          icon={<RiFileTextLine />}
          title={emptyTitle(needle, status)}
          description={emptyDescription(needle, status)}
          action={
            needle ? (
              <AlignButton.Root
                size="small"
                variant="neutral"
                mode="stroke"
                onClick={onClearSearch}
              >
                Clear search
              </AlignButton.Root>
            ) : status !== "draft" ? (
              <AlignButton.Root size="small" variant="neutral" mode="stroke" onClick={onViewDrafts}>
                View drafts
              </AlignButton.Root>
            ) : (
              <AlignFancyButton.Root size="small" onClick={onCreate}>
                Add thesis
              </AlignFancyButton.Root>
            )
          }
        />
      )}
      {visibleRows.map((thesis) => (
        <AdminThesisRow key={thesis.id} thesis={thesis} onEdit={onEdit} onAction={onAction} />
      ))}
    </>
  );
}

function AdminThesesPage() {
  const initialData = Route.useLoaderData();
  const { identity } = initialData;
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<ThesisStatusFilter>("draft");
  const [query, setQuery] = useState("");
  const [formModal, setFormModal] = useState<{ open: boolean; thesis: AdminThesis | null }>({
    open: false,
    thesis: null,
  });
  const [confirmation, setConfirmation] = useState<ThesisConfirmation | null>(null);
  const queryClient = useQueryClient();
  const needle = useDeferredValue(query.trim().slice(0, 300));
  const thesesQuery = useQuery(adminThesesQuery(offset, status, needle));
  const counts = thesesQuery.data?.counts ?? initialData.counts;
  const lecturers = thesesQuery.data?.lecturers ?? initialData.lecturers;
  const fields = thesesQuery.data?.fields ?? initialData.fields;
  const rows = thesesQuery.data?.rows ?? [];
  const visibleRows = rows.slice(0, 50);
  const count = visibleRows.length;
  const total = counts[status];
  const hasNext = rows.length > 50;

  function changeSearch(value: string) {
    setQuery(value);
    setOffset(0);
  }

  async function invalidateThesisQueries() {
    await queryClient.invalidateQueries({ queryKey: ["admin", "theses"] });
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: { thesisId?: string; values: CreateThesisInput }) => {
      if (payload.thesisId) {
        const { slug: _slug, ...fields } = payload.values;
        const updated = await updateAdminThesis({
          data: { thesisId: payload.thesisId, ...fields },
        });
        return { id: updated.thesisId, created: false, status: payload.values.status };
      }
      const created = await createAdminThesis({ data: payload.values });
      return { id: created.id, created: true, status: payload.values.status };
    },
    onSuccess: async (result) => {
      await invalidateThesisQueries();
      setFormModal({ open: false, thesis: null });
      setStatus(result.status);
      setOffset(0);
    },
  });

  const lifecycleMutation = useMutation({
    mutationFn: (input: ThesisLifecycleInput) => changeAdminThesisLifecycle({ data: input }),
    onSuccess: async (_result, input) => {
      await invalidateThesisQueries();
      setConfirmation(null);
      setStatus(
        input.action === "publish"
          ? "published"
          : input.action === "hide"
            ? "hidden"
            : input.action === "delete"
              ? "deleted"
              : "draft",
      );
      setOffset(0);
    },
  });

  function openCreateModal() {
    saveMutation.reset();
    setFormModal({ open: true, thesis: null });
  }

  function openEditModal(thesis: AdminThesis) {
    saveMutation.reset();
    setFormModal({ open: true, thesis });
  }

  function confirmAction(thesis: AdminThesis, action: ThesisLifecycleInput["action"]) {
    lifecycleMutation.reset();
    setConfirmation({ thesis, action });
  }

  const list = (
    <ThesesListBody
      queryState={thesesQuery}
      visibleRows={visibleRows}
      needle={needle}
      status={status}
      onClearSearch={() => changeSearch("")}
      onViewDrafts={() => {
        setStatus("draft");
        setOffset(0);
      }}
      onCreate={openCreateModal}
      onEdit={openEditModal}
      onAction={confirmAction}
    />
  );

  return (
    <>
      <AdminPageHeader
        title="Theses"
        manager={canManageUsers(identity.role)}
        userName={identity.name}
        userEmail={identity.email}
        userImage={identity.image}
        action={
          <AlignFancyButton.Root size="xxsmall" onClick={openCreateModal}>
            Add thesis
          </AlignFancyButton.Root>
        }
      />
      <AdminFilterBar
        ariaLabel="Thesis status filters"
        tabs={thesisStatusFilterSchema.options.map((value) => ({
          value,
          label: statusLabels[value],
          count: counts[value],
        }))}
        activeTab={status}
        onTabChange={(value) => {
          setStatus(value);
          setOffset(0);
        }}
      >
        <AdminSearchInput
          value={query}
          onChange={changeSearch}
          placeholder="Search by title, author, or ID"
          ariaLabel="Filter theses"
        />
      </AdminFilterBar>
      <div className="flex min-h-0 flex-1 flex-col bg-bg-white-0">
        {!thesesQuery.isPending && !thesesQuery.isError && (
          <AdminPagination
            count={count}
            offset={offset}
            total={total}
            label="theses"
            hasNext={hasNext}
            onPrevious={() => setOffset((current) => Math.max(0, current - 50))}
            onNext={() => setOffset((current) => current + 50)}
          />
        )}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-white-0 ${count === 0 ? "flex flex-col" : ""}`}
        >
          {list}
        </div>
      </div>
      <ThesisFormModal
        open={formModal.open}
        thesis={formModal.thesis}
        lecturers={lecturers}
        fields={fields}
        pending={saveMutation.isPending}
        error={
          saveMutation.isError
            ? "Could not save thesis. Check the fields and slug, then try again."
            : undefined
        }
        onClose={() => setFormModal({ open: false, thesis: null })}
        onSubmit={(values) => saveMutation.mutate({ thesisId: formModal.thesis?.id, values })}
      />
      <ThesisLifecycleModal
        confirmation={confirmation}
        error={lifecycleMutation.error}
        isPending={lifecycleMutation.isPending}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation) {
            lifecycleMutation.mutate({
              thesisId: confirmation.thesis.id,
              action: confirmation.action,
            });
          }
        }}
      />
    </>
  );
}
