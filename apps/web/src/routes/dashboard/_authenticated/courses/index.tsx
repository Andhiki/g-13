import { useAdminList } from "../-client/useAdminList";
import { adminListSearchSchema } from "../-shared/admin-search";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { RiBookOpenLine } from "@remixicon/react";
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
import { adminCoursesQuery } from "./-client/queries";
import { AdminCourseRow, courseTableColumns, type AdminCourse } from "./-components/AdminCourseRow";
import { CourseFormModal } from "./-components/CourseFormModal";
import { CourseInspector } from "./-components/CourseInspector";
import {
  changeAdminCourseLifecycle,
  createAdminCourse,
  updateAdminCourse,
} from "./-server/handler";
import {
  courseStatusSchema,
  type CourseFieldsInput,
  type CourseLifecycleInput,
  type CourseStatus,
} from "./-shared/schemas";

export const Route = createFileRoute("/dashboard/_authenticated/courses/")({
  validateSearch: adminListSearchSchema,
  loader: async ({ context }) => {
    try {
      return await context.queryClient.fetchQuery(adminCoursesQuery());
    } catch (error) {
      if (error instanceof Response && (error.status === 401 || error.status === 403))
        throw redirect({ to: "/dashboard/login" });
      throw error;
    }
  },
  pendingComponent: DashboardRoutePending,
  component: AdminCoursesPage,
});

function courseEmptyAction({
  needle,
  status,
  activeCount,
  onClearSearch,
  onViewActive,
  onCreate,
}: {
  needle: string;
  status: CourseStatus;
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
        View active courses
      </AlignButton.Root>
    );
  }
  if (status === "active") {
    return (
      <AlignFancyButton.Root size="small" onClick={onCreate}>
        Add course
      </AlignFancyButton.Root>
    );
  }
  return undefined;
}

function CoursesListBody({
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
  visibleRows: AdminCourse[];
  needle: string;
  status: CourseStatus;
  activeCount: number;
  selectedId?: string;
  onClearSearch: () => void;
  onViewActive: () => void;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onEdit: (course: AdminCourse) => void;
  onLifecycle: (input: CourseLifecycleInput, label: string) => void;
}) {
  if (queryState.isError) {
    return (
      <div className="p-4">
        <Typography role="alert">Could not load courses. Refresh or sign in again.</Typography>
      </div>
    );
  }
  if (queryState.isPending) return <DashboardPending />;
  const emptyTitle = needle
    ? "No matching courses"
    : status === "active"
      ? "No courses yet"
      : "No deleted courses";
  const emptyDescription = needle
    ? "Try another search term or clear the search to see catalogue courses."
    : status === "active"
      ? "Courses available for students to select in public reviews are managed here. Add a course if one is missing."
      : "Deleted courses are kept here and can be restored to the review form.";

  return (
    <>
      <AdminTableHeader
        className={`hidden lg:sticky lg:top-0 lg:z-10 lg:grid ${courseTableColumns}`}
      >
        <span>Code</span>
        <span>Course</span>
        <span className="text-right">Reviews</span>
        <span className="text-right">Actions</span>
      </AdminTableHeader>
      {visibleRows.length === 0 && (
        <DashboardEmptyState
          icon={<RiBookOpenLine />}
          title={emptyTitle}
          description={emptyDescription}
          action={courseEmptyAction({
            needle,
            status,
            activeCount,
            onClearSearch,
            onViewActive,
            onCreate,
          })}
        />
      )}
      {visibleRows.map((course) => (
        <AdminCourseRow
          key={course.id}
          course={course}
          selected={selectedId === course.id}
          onSelect={() => onSelect(course.id)}
          onEdit={onEdit}
          onLifecycle={onLifecycle}
        />
      ))}
    </>
  );
}

function CourseLifecycleModal({
  confirmation,
  isError,
  isPending,
  onClose,
  onConfirm,
}: {
  confirmation: { input: CourseLifecycleInput; label: string } | null;
  isError: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const deleting = confirmation?.input.action === "delete";
  const summary = deleting
    ? "This hides the course from public catalogs and new review submissions. Existing reviews stay preserved and you can restore it anytime."
    : "This restores the course to public catalogs and makes it available for new review submissions again.";

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
      confirmLabel={deleting ? "Delete course" : "Restore course"}
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

function CoursesContent({
  queryState,
  visibleRows,
  count,
  offset,
  total,
  hasNext,
  needle,
  status,
  activeCount,
  selectedCourse,
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
  visibleRows: AdminCourse[];
  count: number;
  offset: number;
  total: number;
  hasNext: boolean;
  needle: string;
  status: CourseStatus;
  activeCount: number;
  selectedCourse: AdminCourse | undefined;
  detailsVisible: boolean;
  mobileDetailsOpen: boolean;
  onMobileDetailsOpenChange: (open: boolean) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onClearSearch: () => void;
  onViewActive: () => void;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onEdit: (course: AdminCourse) => void;
  onLifecycle: (input: CourseLifecycleInput, label: string) => void;
}) {
  return (
    <AdminInspectorLayout
      title="Course details"
      desktopOpen={detailsVisible}
      mobileOpen={mobileDetailsOpen}
      onMobileOpenChange={onMobileDetailsOpenChange}
      details={
        selectedCourse &&
        !queryState.isPending &&
        !queryState.isError && (
          <CourseInspector
            key={selectedCourse.id}
            course={selectedCourse}
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
          label="courses"
          hasNext={hasNext}
          onPrevious={onPreviousPage}
          onNext={onNextPage}
        />
      )}
      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-white-0 ${count === 0 ? "flex flex-col" : ""}`}
      >
        <CoursesListBody
          queryState={queryState}
          visibleRows={visibleRows}
          needle={needle}
          status={status}
          activeCount={activeCount}
          selectedId={selectedCourse?.id}
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

function AdminCoursesPage() {
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
  } = useAdminList("active", adminCoursesQuery, initialData.counts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [formModal, setFormModal] = useState<{ open: boolean; course: AdminCourse | null }>({
    open: false,
    course: null,
  });
  const [confirmation, setConfirmation] = useState<{
    input: CourseLifecycleInput;
    label: string;
  } | null>(null);

  const queryClient = useQueryClient();

  const count = visibleRows.length;
  const selectedCourse = visibleRows.find((course) => course.id === selectedId) ?? visibleRows[0];
  const detailsVisible =
    detailsOpen && !!selectedCourse && !listState.isPending && !listState.isError;

  async function invalidateCourseQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin"] }),
      queryClient.invalidateQueries({ queryKey: ["lecturer-reviews"] }),
    ]);
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: { courseId?: string; values: CourseFieldsInput }) => {
      if (payload.courseId) {
        const updated = await updateAdminCourse({
          data: { courseId: payload.courseId, ...payload.values },
        });
        return { id: updated.courseId, created: false };
      }
      const created = await createAdminCourse({ data: payload.values });
      return { id: created.id, created: true };
    },
    onSuccess: async (result) => {
      await invalidateCourseQueries();
      setFormModal({ open: false, course: null });
      if (result.created) {
        setStatus("active");
        setSelectedId(result.id);
      }
    },
  });

  const lifecycleMutation = useMutation({
    mutationFn: (input: CourseLifecycleInput) => changeAdminCourseLifecycle({ data: input }),
    onSuccess: async () => {
      await invalidateCourseQueries();
      setConfirmation(null);
    },
  });

  function openCreateModal() {
    saveMutation.reset();
    setFormModal({ open: true, course: null });
  }

  function openEditModal(course: AdminCourse) {
    saveMutation.reset();
    setFormModal({ open: true, course });
  }

  function confirmLifecycle(input: CourseLifecycleInput, label: string) {
    lifecycleMutation.reset();
    setConfirmation({ input, label });
  }

  const searchAndDetails = (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <AdminSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Filter code or course name…"
        ariaLabel="Filter courses"
      />
      <DetailsToggleButton
        available={!!selectedCourse}
        visible={detailsVisible}
        onToggle={() => setDetailsOpen((open) => !open)}
      />
    </div>
  );

  return (
    <>
      <AdminPageHeader
        title="Courses"
        action={
          <AlignFancyButton.Root size="xxsmall" onClick={openCreateModal}>
            Add course
          </AlignFancyButton.Root>
        }
      />
      <AdminFilterBar
        ariaLabel="Course status filters"
        tabs={courseStatusSchema.options.map((value) => ({
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
      <CoursesContent
        queryState={listState}
        visibleRows={visibleRows}
        count={count}
        offset={offset}
        total={total}
        needle={needle}
        status={status}
        activeCount={counts.active}
        selectedCourse={selectedCourse}
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
      <CourseFormModal
        open={formModal.open}
        course={formModal.course}
        pending={saveMutation.isPending}
        error={saveMutation.isError ? "Could not save course. Refresh and try again." : undefined}
        onClose={() => setFormModal({ open: false, course: null })}
        onSubmit={(values) => saveMutation.mutate({ courseId: formModal.course?.id, values })}
      />
      <CourseLifecycleModal
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
