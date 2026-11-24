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
import { AdminTableHeader } from "../../-components/AdminTable";
import { DashboardEmptyState } from "../../-components/DashboardEmptyState";
import { DashboardPending } from "../../-components/DashboardPending";
import { AdminResourceRow, resourceTableColumns, type AdminResource } from "./AdminResourceRow";
import { type ResourceLifecycleInput, type ResourceStatus } from "../-shared/schemas";

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

export function ResourcesListBody({
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
    </>
  );
}
