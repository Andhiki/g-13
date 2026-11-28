import { AdminSearchHighlightScope } from "../-client/search-highlight";
import { useAdminList } from "../-client/useAdminList";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { RiLinksLine } from "@remixicon/react";
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
import { adminResourcesQuery } from "./-client/queries";
import {
  AdminResourceRow,
  resourceTableColumns,
  type AdminResource,
} from "./-components/AdminResourceRow";
import { ResourceFormModal } from "./-components/ResourceFormModal";
import { ResourceInspector } from "./-components/ResourceInspector";
import {
  changeAdminResourceLifecycle,
  createAdminResource,
  loadAdminResources,
  reorderAdminResources,
  updateAdminResource,
} from "./-server/handler";
import { resourceMutationErrorMessage } from "./-shared/errors";
import {
  resourceStatusSchema,
  type ReorderResourcesInput,
  type ResourceFieldsInput,
  type ResourceLifecycleInput,
  type ResourceStatus,
} from "./-shared/schemas";

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

function resourceEmptyAction({
  needle,
  status,
  activeCount,
  onClearSearch,
  onViewActive,
  onCreate,
}: {
  needle: string;
  status: ResourceStatus;
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
        View active resources
      </AlignButton.Root>
    );
  }
  if (status === "active") {
    return (
      <AlignFancyButton.Root size="small" onClick={onCreate}>
        Add resource
      </AlignFancyButton.Root>
    );
  }
  return undefined;
}

function ResourcesListBody({
  queryState,
  visibleRows,
  needle,
  status,
  activeCount,
  selectedId,
  sortable,
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
  needle: string;
  status: ResourceStatus;
  activeCount: number;
  selectedId?: string;
  sortable: boolean;
  onClearSearch: () => void;
  onViewActive: () => void;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onEdit: (resource: AdminResource) => void;
  onLifecycle: (input: ResourceLifecycleInput, label: string) => void;
  onReorder: (movedId: string, orderedIds: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (queryState.isError) {
    return (
      <div className="p-4">
        <Typography role="alert">Could not load resources. Refresh or sign in again.</Typography>
      </div>
    );
  }
  if (queryState.isPending) return <DashboardPending />;
  const emptyTitle = needle
    ? "No matching resources"
    : status === "active"
      ? "No learning resources yet"
      : "No deleted resources";
  const emptyDescription = needle
    ? "Try another search term or clear the search to see every resource."
    : status === "active"
      ? "Links shown on the public resources page are managed here. Add one to recommend a new learning resource."
      : "Deleted resources are kept here and can be restored to the public page.";

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = visibleRows.map((resource) => resource.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(String(active.id), arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <>
      <AdminTableHeader
        className={`hidden lg:sticky lg:top-0 lg:z-10 lg:grid ${resourceTableColumns}`}
      >
        <span className="pl-8">Resource</span>
        <span>Link</span>
        <span>Updated</span>
        <span className="text-right">Actions</span>
      </AdminTableHeader>
      {visibleRows.length === 0 && (
        <DashboardEmptyState
          icon={<RiLinksLine />}
          title={emptyTitle}
          description={emptyDescription}
          action={resourceEmptyAction({
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={visibleRows.map((resource) => resource.id)}
            strategy={verticalListSortingStrategy}
          >
            {visibleRows.map((resource) => (
              <AdminResourceRow
                key={resource.id}
                resource={resource}
                selected={selectedId === resource.id}
                sortable={sortable}
                onSelect={() => onSelect(resource.id)}
                onEdit={onEdit}
                onLifecycle={onLifecycle}
              />
            ))}
          </SortableContext>
        </DndContext>
      </AdminSearchHighlightScope>
    </>
  );
}

function ResourceLifecycleModal({
  confirmation,
  isError,
  isPending,
  onClose,
  onConfirm,
}: {
  confirmation: { input: ResourceLifecycleInput; label: string } | null;
  isError: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const deleting = confirmation?.input.action === "delete";
  const summary = deleting
    ? "This hides the resource from the public resources page. The record is kept and you can restore it anytime."
    : "This restores the resource to the public page in its saved order.";

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
      confirmLabel={deleting ? "Delete resource" : "Restore resource"}
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
  const list = (
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
  );

  return (
    <AdminInspectorLayout
      title="Resource details"
      desktopOpen={detailsVisible}
      mobileOpen={mobileDetailsOpen}
      onMobileOpenChange={onMobileDetailsOpenChange}
      details={
        selectedResource &&
        !queryState.isPending &&
        !queryState.isError && (
          <ResourceInspector
            key={selectedResource.id}
            resource={selectedResource}
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
        {list}
      </div>
    </AdminInspectorLayout>
  );
}

type ResourceCounts = Awaited<ReturnType<typeof loadAdminResources>>["counts"];

function ResourcesToolbar({
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
    rows: basePageRows,
    total,
    page,
  } = useAdminList("active", adminResourcesQuery, initialData.counts);
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
  const visibleRows =
    !needle && orderedIds
      ? orderedIds
          .map((id) => basePageRows.find((row) => row.id === id))
          .filter((row): row is AdminResource => row !== undefined)
      : basePageRows;

  const count = visibleRows.length;
  const selectedResource =
    visibleRows.find((resource) => resource.id === selectedId) ?? visibleRows[0];
  const detailsVisible =
    detailsOpen && !!selectedResource && !listState.isPending && !listState.isError;

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

  const sortable = !query.trim() && !needle && !reorderMutation.isPending && visibleRows.length > 1;

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

  const formError = saveMutation.isError
    ? (resourceMutationErrorMessage(saveMutation.error) ??
      "Could not save resource. Refresh and try again.")
    : undefined;

  return (
    <>
      <ResourcesToolbar
        counts={counts}
        status={status}
        query={query}
        selectedAvailable={!!selectedResource}
        detailsVisible={detailsVisible}
        onStatusChange={(value) => {
          setStatus(value);
          setSelectedId(null);
          setOrderedIds(null);
        }}
        onQueryChange={(value) => {
          setOrderedIds(null);
          setQuery(value);
        }}
        onToggleDetails={() => setDetailsOpen((open) => !open)}
        onCreate={openCreateModal}
      />
      <ResourcesContent
        queryState={listState}
        visibleRows={visibleRows}
        count={count}
        offset={offset}
        total={total}
        needle={needle}
        status={status}
        activeCount={counts.active}
        selectedResource={selectedResource}
        detailsVisible={detailsVisible}
        mobileDetailsOpen={mobileDetailsOpen}
        sortable={sortable}
        reorderError={reorderMutation.isError}
        onMobileDetailsOpenChange={setMobileDetailsOpen}
        hasNext={page.hasNext}
        onPreviousPage={() => {
          setOrderedIds(null);
          page.previous();
        }}
        onNextPage={() => {
          setOrderedIds(null);
          page.next();
        }}
        onClearSearch={() => setQuery("")}
        onViewActive={() => {
          setStatus("active");
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
        formError={formError}
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
