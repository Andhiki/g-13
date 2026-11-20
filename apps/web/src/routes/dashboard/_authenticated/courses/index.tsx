import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { canManageUsers } from "@g13/auth";
import { RiBookOpenLine, RiCloseLine, RiSearchLine } from "@remixicon/react";
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
  loader: async ({ context }) => {
    try {
      return await context.queryClient.fetchQuery(adminCoursesQuery());
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
  component: AdminCoursesPage,
});

function AdminCoursesPage() {
  const initialData = Route.useLoaderData();
  const { identity } = initialData;
  const { detailsOpen, setDetailsOpen } = useAdminLayout();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<CourseStatus>("active");
  const [query, setQuery] = useState("");
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
  const coursesQuery = useQuery(adminCoursesQuery(offset, status));
  const counts = coursesQuery.data?.counts ?? initialData.counts;
  const courseRows = coursesQuery.data?.rows ?? [];
  const pageRows = courseRows.slice(0, 50);
  const needle = query.trim().toLowerCase();
  const visibleRows = needle
    ? pageRows.filter((row) =>
        `${row.code} ${row.nameId} ${row.nameEn} ${row.id}`.toLowerCase().includes(needle),
      )
    : pageRows;
  const count = visibleRows.length;
  const total = needle ? visibleRows.length : counts[status];
  const selectedCourse = visibleRows.find((course) => course.id === selectedId) ?? visibleRows[0];
  const detailsVisible =
    detailsOpen && !!selectedCourse && !coursesQuery.isPending && !coursesQuery.isError;

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
        setOffset(0);
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

  return (
    <>
      <AdminPageHeader
        title="Courses"
        manager={canManageUsers(identity.role)}
        userName={identity.name}
        userImage={identity.image}
        action={
          <AlignFancyButton.Root size="xxsmall" onClick={openCreateModal}>
            Add course
          </AlignFancyButton.Root>
        }
      />
      <div
        className="flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stroke-soft-200 px-3 py-1.5"
        aria-label="Course status filters"
      >
        <div className="flex items-center gap-1 overflow-x-auto">
          {courseStatusSchema.options.map((value) => (
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
              placeholder="Filter code or course name…"
              aria-label="Filter courses"
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
            available={!!selectedCourse}
            visible={detailsVisible}
            onToggle={() => setDetailsOpen((open) => !open)}
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg-white-0">
          {!coursesQuery.isPending && !coursesQuery.isError && (
            <AdminPagination
              count={count}
              offset={needle ? 0 : offset}
              total={total}
              label="courses"
              hasNext={!needle && courseRows.length > 50}
              onPrevious={() => setOffset((current) => Math.max(0, current - 50))}
              onNext={() => setOffset((current) => current + 50)}
            />
          )}
          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-white-0 ${count === 0 ? "flex flex-col" : ""}`}
          >
            {coursesQuery.isError ? (
              <Typography role="alert" className="p-4">
                Could not load courses. Refresh or sign in again.
              </Typography>
            ) : coursesQuery.isPending ? (
              <div className="flex h-full min-h-64 items-center justify-center p-6">
                <Loading tone="neutral" />
              </div>
            ) : (
              <>
                <AdminTableHeader
                  className={`hidden lg:sticky lg:top-0 lg:z-10 lg:grid ${courseTableColumns}`}
                >
                  <span>Code</span>
                  <span>Course</span>
                  <span className="text-right">Reviews</span>
                  <span className="text-right">Actions</span>
                </AdminTableHeader>
                {!count && (
                  <DashboardEmptyState
                    icon={<RiBookOpenLine />}
                    title={
                      needle
                        ? "No matching courses"
                        : status === "active"
                          ? "No courses yet"
                          : "No deleted courses"
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
                          View active courses
                        </AlignButton.Root>
                      ) : status === "active" ? (
                        <AlignFancyButton.Root size="small" onClick={openCreateModal}>
                          Add course
                        </AlignFancyButton.Root>
                      ) : undefined
                    }
                  />
                )}
                {visibleRows.map((course) => (
                  <AdminCourseRow
                    key={course.id}
                    course={course}
                    selected={selectedCourse?.id === course.id}
                    onSelect={() => {
                      setSelectedId(course.id);
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
          title="Course details"
          desktopOpen={detailsVisible}
          mobileOpen={mobileDetailsOpen}
          onMobileOpenChange={setMobileDetailsOpen}
        >
          {selectedCourse && !coursesQuery.isPending && !coursesQuery.isError && (
            <CourseInspector
              key={selectedCourse.id}
              course={selectedCourse}
              onEdit={openEditModal}
              onLifecycle={confirmLifecycle}
            />
          )}
        </AdminInspector>
      </div>
      <CourseFormModal
        open={formModal.open}
        course={formModal.course}
        pending={saveMutation.isPending}
        error={saveMutation.isError ? "Could not save course. Refresh and try again." : undefined}
        onClose={() => setFormModal({ open: false, course: null })}
        onSubmit={(values) => saveMutation.mutate({ courseId: formModal.course?.id, values })}
      />
      <ConfirmActionModal
        open={confirmation !== null}
        title={confirmation?.input.action === "delete" ? "Confirm delete" : "Confirm restore"}
        description={
          <>
            <strong className="text-text-strong-950">{confirmation?.label}</strong>.{" "}
            {confirmation?.input.action === "delete"
              ? "This hides the course from public catalogs and new review submissions. Existing reviews stay preserved and you can restore it anytime."
              : "This restores the course to public catalogs and makes it available for new review submissions again."}
          </>
        }
        confirmLabel={confirmation?.input.action === "delete" ? "Delete course" : "Restore course"}
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
