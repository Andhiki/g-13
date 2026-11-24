import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { canManageUsers } from "@g13/auth";
import { RiLinksLine } from "@remixicon/react";
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
  updateAdminResource,
} from "./-server/handler";
import {
  resourceStatusSchema,
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
  onClearSearch,
  onViewActive,
  onCreate,
  onSelect,
  onEdit,
  onLifecycle,
}: {
  queryState: { isError: boolean; isPending: boolean };
  visibleRows: AdminResource[];
  needle: string;
  status: ResourceStatus;
  activeCount: number;
  selectedId?: string;
  onClearSearch: () => void;
  onViewActive: () => void;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onEdit: (resource: AdminResource) => void;
  onLifecycle: (input: ResourceLifecycleInput, label: string) => void;
}) {
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

  return (
    <>
      <AdminTableHeader
        className={`hidden lg:sticky lg:top-0 lg:z-10 lg:grid ${resourceTableColumns}`}
      >
        <span>Resource</span>
        <span>Link</span>
        <span className="text-right">Order</span>
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
      {visibleRows.map((resource) => (
        <AdminResourceRow
          key={resource.id}
          resource={resource}
          selected={selectedId === resource.id}
          onSelect={() => onSelect(resource.id)}
          onEdit={onEdit}
          onLifecycle={onLifecycle}
        />
      ))}
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
  onMobileDetailsOpenChange: (open: boolean) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onClearSearch: () => void;
  onViewActive: () => void;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onEdit: (resource: AdminResource) => void;
  onLifecycle: (input: ResourceLifecycleInput, label: string) => void;
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
            onClearSearch={onClearSearch}
            onViewActive={onViewActive}
            onCreate={onCreate}
            onSelect={onSelect}
            onEdit={onEdit}
            onLifecycle={onLifecycle}
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

function AdminResourcesPage() {
  const initialData = Route.useLoaderData();
  const { identity } = initialData;
  const { detailsOpen, setDetailsOpen } = useAdminLayout();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<ResourceStatus>("active");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
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
  const nextSortOrder = resourcesQuery.data?.nextSortOrder ?? initialData.nextSortOrder;
  const resourceRows = resourcesQuery.data?.rows ?? [];
  const pageRows = resourceRows.slice(0, 50);
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
      setConfirmation(null);
    },
  });

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

  const searchAndDetails = (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <AdminSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Filter title, description, or link…"
        ariaLabel="Filter learning resources"
      />
      <DetailsToggleButton
        available={!!selectedResource}
        visible={detailsVisible}
        onToggle={() => setDetailsOpen((open) => !open)}
      />
    </div>
  );

  return (
    <>
      <AdminPageHeader
        title="Learning resources"
        manager={canManageUsers(identity.role)}
        userName={identity.name}
        userEmail={identity.email}
        userImage={identity.image}
        action={
          <AlignFancyButton.Root size="xxsmall" onClick={openCreateModal}>
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
        onTabChange={(value) => {
          setStatus(value);
          setOffset(0);
          setSelectedId(null);
        }}
      >
        {searchAndDetails}
      </AdminFilterBar>
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
        onMobileDetailsOpenChange={setMobileDetailsOpen}
        onPreviousPage={() => setOffset((current) => Math.max(0, current - 50))}
        onNextPage={() => setOffset((current) => current + 50)}
        onClearSearch={() => setQuery("")}
        onViewActive={() => {
          setStatus("active");
          setOffset(0);
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
      <ResourceFormModal
        open={formModal.open}
        resource={formModal.resource}
        nextSortOrder={nextSortOrder}
        pending={saveMutation.isPending}
        error={saveMutation.isError ? "Could not save resource. Refresh and try again." : undefined}
        onClose={() => setFormModal({ open: false, resource: null })}
        onSubmit={(values) => saveMutation.mutate({ resourceId: formModal.resource?.id, values })}
      />
      <ResourceLifecycleModal
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
