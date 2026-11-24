import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { canManageUsers } from "@g13/auth";
import { AlignFancyButton } from "@/ui/fancy-button";
import { Typography } from "@/ui/typography";
import { AdminFilterBar, AdminSearchInput } from "../-components/AdminFilterBar";
import { AdminInspector, desktopInspectorQuery } from "../-components/AdminInspector";
import { useAdminLayout } from "../-components/AdminLayoutContext";
import { AdminPageHeader, DetailsToggleButton } from "../-components/AdminPageHeader";
import { AdminPagination } from "../-components/AdminPagination";
import { DashboardRoutePending } from "../-components/DashboardPending";
import { adminResourcesQuery } from "./-client/queries";
import { type AdminResource } from "./-components/AdminResourceRow";
import { ResourceFormModal } from "./-components/ResourceFormModal";
import { ResourceInspector } from "./-components/ResourceInspector";
import {
  changeAdminResourceLifecycle,
  createAdminResource,
  loadAdminResources,
  reorderAdminResources,
  updateAdminResource,
} from "./-server/handler";
import {
  resourceStatusSchema,
  type ReorderResourcesInput,
  type ResourceFieldsInput,
  type ResourceLifecycleInput,
  type ResourceStatus,
} from "./-shared/schemas";
import { ResourcesListBody } from "./-components/ResourcesListBody";
import { ResourceLifecycleModal } from "./-components/ResourceLifecycleModal";

export const Route = createFileRoute("/dashboard/_authenticated/resources/")({
  loader: async ({ context }) => {
    try {
      return await context.queryClient.fetchQuery(adminResourcesQuery());
    } catch (error) {
      if (error instanceof Response && (error.status === 401 || error.status === 403))
        throw redirect({ to: "/dashboard/login" });
      throw error;
    }
  },
  pendingComponent: DashboardRoutePending,
  component: AdminResourcesPage,
});

function ResourcesContent({
  queryState,
  visibleRows,
  count,
  offset,
  total,
  hasNext,
  needle,
  status,
  activeCount,
  selectedResource,
  detailsVisible,
  mobileDetailsOpen,
  sortable,
  reorderError,
  onMobileDetailsOpenChange,
  onPreviousPage,
  onNextPage,
  onClearSearch,
  onViewActive,
  onCreate,
  onSelect,
  onEdit,
  onLifecycle,
  onReorder,
}: {
  queryState: { isError: boolean; isPending: boolean };
  visibleRows: AdminResource[];
  count: number;
  offset: number;
  total: number;
  hasNext: boolean;
  needle: string;
  status: ResourceStatus;
  activeCount: number;
  selectedResource: AdminResource | undefined;
  detailsVisible: boolean;
  mobileDetailsOpen: boolean;
  sortable: boolean;
  reorderError: boolean;
  onMobileDetailsOpenChange: (open: boolean) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onClearSearch: () => void;
  onViewActive: () => void;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onEdit: (resource: AdminResource) => void;
  onLifecycle: (input: ResourceLifecycleInput, label: string) => void;
  onReorder: (movedId: string, orderedIds: string[]) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg-white-0">
        {!queryState.isPending && !queryState.isError && (
          <AdminPagination
            count={count}
            offset={needle ? 0 : offset}
            total={total}
            label="resources"
            hasNext={hasNext}
            onPrevious={onPreviousPage}
            onNext={onNextPage}
          />
        )}
        {reorderError && !queryState.isPending && !queryState.isError && (
          <div className="border-b border-stroke-soft-200 px-4 py-2">
            <Typography role="alert" variant="caption" color="danger">
              Could not save the new order. Refresh and try again.
            </Typography>
          </div>
        )}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-white-0 ${count === 0 ? "flex flex-col" : ""}`}
        >
          <ResourcesListBody
            queryState={queryState}
            visibleRows={visibleRows}
            needle={needle}
            status={status}
            activeCount={activeCount}
            selectedId={selectedResource?.id}
            sortable={sortable}
            onClearSearch={onClearSearch}
            onViewActive={onViewActive}
            onCreate={onCreate}
            onSelect={onSelect}
            onEdit={onEdit}
            onLifecycle={onLifecycle}
            onReorder={onReorder}
          />
        </div>
      </div>
      <AdminInspector
        title="Resource details"
        desktopOpen={detailsVisible}
        mobileOpen={mobileDetailsOpen}
        onMobileOpenChange={onMobileDetailsOpenChange}
      >
        {selectedResource && !queryState.isPending && !queryState.isError && (
          <ResourceInspector
            key={selectedResource.id}
            resource={selectedResource}
            onEdit={onEdit}
            onLifecycle={onLifecycle}
          />
        )}
      </AdminInspector>
    </div>
  );
}

type ResourceIdentity = Awaited<ReturnType<typeof loadAdminResources>>["identity"];
type ResourceCounts = Awaited<ReturnType<typeof loadAdminResources>>["counts"];

function ResourcesToolbar({
  identity,
  counts,
  status,
  query,
  selectedAvailable,
  detailsVisible,
  onStatusChange,
  onQueryChange,
  onToggleDetails,
  onCreate,
}: {
  identity: ResourceIdentity;
  counts: ResourceCounts;
  status: ResourceStatus;
  query: string;
  selectedAvailable: boolean;
  detailsVisible: boolean;
  onStatusChange: (status: ResourceStatus) => void;
  onQueryChange: (value: string) => void;
  onToggleDetails: () => void;
  onCreate: () => void;
}) {
  return (
    <>
      <AdminPageHeader
        title="Learning resources"
        manager={canManageUsers(identity.role)}
        userName={identity.name}
        userEmail={identity.email}
        userImage={identity.image}
        action={
          <AlignFancyButton.Root size="xxsmall" onClick={onCreate}>
            Add resource
          </AlignFancyButton.Root>
        }
      />
      <AdminFilterBar
        ariaLabel="Resource status filters"
        tabs={resourceStatusSchema.options.map((value) => ({
          value,
          label: value === "active" ? "Active" : "Deleted",
          count: counts[value],
        }))}
        activeTab={status}
        onTabChange={onStatusChange}
      >
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <AdminSearchInput
            value={query}
            onChange={onQueryChange}
            placeholder="Filter title, description, or link…"
            ariaLabel="Filter learning resources"
          />
          <DetailsToggleButton
            available={selectedAvailable}
            visible={detailsVisible}
            onToggle={onToggleDetails}
          />
        </div>
      </AdminFilterBar>
    </>
  );
}

function ResourcesModals({
  formState,
  formPending,
  formError,
  confirmation,
  lifecyclePending,
  lifecycleError,
  onCloseForm,
  onCloseConfirmation,
  onSave,
  onConfirmLifecycle,
}: {
  formState: { open: boolean; resource: AdminResource | null };
  formPending: boolean;
  formError?: string;
  confirmation: { input: ResourceLifecycleInput; label: string } | null;
  lifecyclePending: boolean;
  lifecycleError: boolean;
  onCloseForm: () => void;
  onCloseConfirmation: () => void;
  onSave: (values: ResourceFieldsInput) => void;
  onConfirmLifecycle: () => void;
}) {
  return (
    <>
      <ResourceFormModal
        open={formState.open}
        resource={formState.resource}
        pending={formPending}
        error={formError}
        onClose={onCloseForm}
        onSubmit={onSave}
      />
      <ResourceLifecycleModal
        confirmation={confirmation}
        isError={lifecycleError}
        isPending={lifecyclePending}
        onClose={onCloseConfirmation}
        onConfirm={onConfirmLifecycle}
      />
    </>
  );
}

function AdminResourcesPage() {
  const initialData = Route.useLoaderData();
  const { identity } = initialData;
  const { detailsOpen, setDetailsOpen } = useAdminLayout();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<ResourceStatus>("active");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [orderedIds, setOrderedIds] = useState<string[] | null>(null);
  const [formModal, setFormModal] = useState<{ open: boolean; resource: AdminResource | null }>({
    open: false,
    resource: null,
  });
  const [confirmation, setConfirmation] = useState<{
    input: ResourceLifecycleInput;
    label: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const resourcesQuery = useQuery(adminResourcesQuery(offset, status));
  const counts = resourcesQuery.data?.counts ?? initialData.counts;
  const resourceRows = resourcesQuery.data?.rows ?? [];
  const basePageRows = resourceRows.slice(0, 50);
  const pageRows = orderedIds
    ? orderedIds
        .map((id) => basePageRows.find((row) => row.id === id))
        .filter((row): row is AdminResource => row !== undefined)
    : basePageRows;
  const needle = query.trim().toLowerCase();
  const visibleRows = needle
    ? pageRows.filter((row) =>
        `${row.titleId} ${row.titleEn} ${row.descriptionId} ${row.descriptionEn} ${row.url}`
          .toLowerCase()
          .includes(needle),
      )
    : pageRows;
  const count = visibleRows.length;
  const total = needle ? visibleRows.length : counts[status];
  const selectedResource =
    visibleRows.find((resource) => resource.id === selectedId) ?? visibleRows[0];
  const detailsVisible =
    detailsOpen && !!selectedResource && !resourcesQuery.isPending && !resourcesQuery.isError;

  async function invalidateResourceQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin"] }),
      queryClient.invalidateQueries({ queryKey: ["resources"] }),
    ]);
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: { resourceId?: string; values: ResourceFieldsInput }) => {
      if (payload.resourceId) {
        const updated = await updateAdminResource({
          data: { resourceId: payload.resourceId, ...payload.values },
        });
        return { id: updated.resourceId, created: false };
      }
      const created = await createAdminResource({ data: payload.values });
      return { id: created.id, created: true };
    },
    onSuccess: async (result) => {
      await invalidateResourceQueries();
      setOrderedIds(null);
      setFormModal({ open: false, resource: null });
      if (result.created) {
        setStatus("active");
        setOffset(0);
        setSelectedId(result.id);
      }
    },
  });

  const lifecycleMutation = useMutation({
    mutationFn: (input: ResourceLifecycleInput) => changeAdminResourceLifecycle({ data: input }),
    onSuccess: async () => {
      await invalidateResourceQueries();
      setOrderedIds(null);
      setConfirmation(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (input: ReorderResourcesInput) => reorderAdminResources({ data: input }),
    onSuccess: async () => {
      await invalidateResourceQueries();
      setOrderedIds(null);
    },
    onError: () => setOrderedIds(null),
  });

  function reorderResources(movedId: string, ids: string[]) {
    setOrderedIds(ids);
    reorderMutation.mutate({ movedId, orderedIds: ids });
  }

  const sortable = !needle && !reorderMutation.isPending && visibleRows.length > 1;

  function openCreateModal() {
    saveMutation.reset();
    setFormModal({ open: true, resource: null });
  }

  function openEditModal(resource: AdminResource) {
    saveMutation.reset();
    setFormModal({ open: true, resource });
  }

  function confirmLifecycle(input: ResourceLifecycleInput, label: string) {
    lifecycleMutation.reset();
    setConfirmation({ input, label });
  }

  return (
    <>
      <ResourcesToolbar
        identity={identity}
        counts={counts}
        status={status}
        query={query}
        selectedAvailable={!!selectedResource}
        detailsVisible={detailsVisible}
        onStatusChange={(value) => {
          setStatus(value);
          setOffset(0);
          setSelectedId(null);
          setOrderedIds(null);
        }}
        onQueryChange={setQuery}
        onToggleDetails={() => setDetailsOpen((open) => !open)}
        onCreate={openCreateModal}
      />
      <ResourcesContent
        queryState={resourcesQuery}
        visibleRows={visibleRows}
        count={count}
        offset={offset}
        total={total}
        hasNext={!needle && resourceRows.length > 50}
        needle={needle}
        status={status}
        activeCount={counts.active}
        selectedResource={selectedResource}
        detailsVisible={detailsVisible}
        mobileDetailsOpen={mobileDetailsOpen}
        sortable={sortable}
        reorderError={reorderMutation.isError}
        onMobileDetailsOpenChange={setMobileDetailsOpen}
        onPreviousPage={() => {
          setOrderedIds(null);
          setOffset((current) => Math.max(0, current - 50));
        }}
        onNextPage={() => {
          setOrderedIds(null);
          setOffset((current) => current + 50);
        }}
        onClearSearch={() => setQuery("")}
        onViewActive={() => {
          setStatus("active");
          setOffset(0);
          setSelectedId(null);
          setOrderedIds(null);
        }}
        onCreate={openCreateModal}
        onSelect={(id) => {
          setSelectedId(id);
          setDetailsOpen(true);
          setMobileDetailsOpen(!window.matchMedia(desktopInspectorQuery).matches);
        }}
        onEdit={openEditModal}
        onLifecycle={confirmLifecycle}
        onReorder={reorderResources}
      />
      <ResourcesModals
        formState={formModal}
        formPending={saveMutation.isPending}
        formError={
          saveMutation.isError ? "Could not save resource. Refresh and try again." : undefined
        }
        confirmation={confirmation}
        lifecyclePending={lifecycleMutation.isPending}
        lifecycleError={lifecycleMutation.isError}
        onCloseForm={() => setFormModal({ open: false, resource: null })}
        onCloseConfirmation={() => setConfirmation(null)}
        onSave={(values) => saveMutation.mutate({ resourceId: formModal.resource?.id, values })}
        onConfirmLifecycle={() => {
          if (confirmation) lifecycleMutation.mutate(confirmation.input);
        }}
      />
    </>
  );
}
