import { useMemo, useState } from "react";
import { RiArrowRightLine, RiCloseLine } from "@remixicon/react";
import { AlignBadge } from "../../../ui/badge";
import { AlignDrawer } from "../../../ui/drawer";
import { CompactButton } from "../../../ui/compact-button";
import { normalizeCourseTitle, type Course, type Curriculum, type Relation } from "../../../data";
import { courseLabels, creditsFor, requirementText, semesterLabel } from "../course-utils";

type CourseDetailsProps = {
  course: Course | null;
  data: Curriculum;
  relations: Relation[];
  select: (id: string) => void;
  close: () => void;
  modal?: boolean;
};

export function CourseDetails({
  course,
  data,
  relations,
  select,
  close,
  modal = true,
}: CourseDetailsProps) {
  const selection = course ? { course, data, relations } : null;
  // Retain the content while Radix runs the close animation.
  const [lastSelection, setLastSelection] = useState(selection);
  if (
    selection &&
    (course !== lastSelection?.course ||
      data !== lastSelection.data ||
      relations !== lastSelection.relations)
  ) {
    setLastSelection(selection);
  }
  const content = selection ?? lastSelection;

  return (
    <AlignDrawer.Root
      modal={modal}
      open={course !== null}
      onOpenChange={(open) => !open && close()}
    >
      {content && <CourseDetailsContent {...content} select={select} modal={modal} />}
    </AlignDrawer.Root>
  );
}

function CourseDetailsContent({
  course,
  data,
  relations,
  select,
  modal,
}: Omit<CourseDetailsProps, "course" | "close"> & { course: Course }) {
  const byId = useMemo(() => new Map(data.all.map((item) => [item.id, item])), [data]);
  const prereqs = relations
    .filter((item) => item.target === course.id)
    .map((item) => byId.get(item.source))
    .filter((item): item is Course => Boolean(item));
  const next = relations
    .filter((item) => item.source === course.id)
    .map((item) => byId.get(item.target))
    .filter((item): item is Course => Boolean(item));
  const labels = courseLabels(course);
  const linkedPrerequisites = new Set(prereqs.map((item) => normalizeCourseTitle(item.title)));
  const requirements = requirementText(course)
    .flatMap((item) => item.split(/[,\n;]+/))
    .map((item) => item.trim())
    .filter((item) => item && !linkedPrerequisites.has(normalizeCourseTitle(item)));
  const credit = creditsFor(course);
  const curriculumLabel =
    data.edition === `Kurikulum ${data.id}`
      ? data.edition
      : `Kurikulum ${data.id} · ${data.edition}`;
  return (
    <AlignDrawer.Content
      modal={modal}
      className={
        modal
          ? undefined
          : "max-[650px]:inset-x-0 max-[650px]:top-auto max-[650px]:h-[45dvh] max-[650px]:max-w-none max-[650px]:border-r-0 max-[650px]:border-t max-[650px]:data-[state=open]:slide-in-from-bottom-full max-[650px]:data-[state=closed]:slide-out-to-bottom-full max-[650px]:data-[state=open]:[--tw-enter-translate-x:0%] max-[650px]:data-[state=closed]:[--tw-exit-translate-x:0%]"
      }
      onInteractOutside={modal ? undefined : (event) => event.preventDefault()}
      aria-label={`Detail ${course.title}`}
    >
      <AlignDrawer.Header className="shrink-0 items-start gap-4 border-b p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="m-0 text-paragraph-xs text-text-sub-600">
            {curriculumLabel} · {course.code || "Mata kuliah pilihan"}
          </p>
          <AlignDrawer.Title className="mt-1 text-label-lg text-text-strong-950">
            {course.title}
          </AlignDrawer.Title>
          {course.englishTitle && (
            <p className="mb-0 mt-1 text-paragraph-sm text-text-sub-600">{course.englishTitle}</p>
          )}
        </div>
        <AlignDrawer.Close asChild>
          <CompactButton aria-label="Tutup detail mata kuliah">
            <RiCloseLine aria-hidden="true" />
          </CompactButton>
        </AlignDrawer.Close>
      </AlignDrawer.Header>
      <AlignDrawer.Description className="sr-only">
        Informasi akademik mata kuliah {course.title}.
      </AlignDrawer.Description>
      <AlignDrawer.Body className="min-h-0 overflow-y-auto p-4 sm:p-5">
        <div className="flex flex-wrap gap-2" aria-label="Kategori mata kuliah">
          {labels.map((label) => (
            <AlignBadge.Root
              variant="light"
              className="h-auto min-h-5 py-0.5 text-[12px] leading-4 font-medium"
              key={label}
            >
              {label}
            </AlignBadge.Root>
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-2 divide-x divide-stroke-soft-200 border-y border-stroke-soft-200 py-3">
          <div className="pr-3">
            <dt className="text-paragraph-xs text-text-sub-600">Semester panduan</dt>
            <dd className="m-0 mt-1 text-label-sm text-text-strong-950">
              {semesterLabel(course).replace("Semester ", "")}
            </dd>
          </div>
          <div className="pl-3">
            <dt className="text-paragraph-xs text-text-sub-600">Beban</dt>
            <dd className="m-0 mt-1 text-label-sm text-text-strong-950">
              {credit === null ? "—" : credit + " SKS"}
            </dd>
          </div>
        </dl>
        {(prereqs.length > 0 || requirements.length > 0) && (
          <section className="mt-5">
            <h3 className="m-0 text-label-sm text-text-strong-950">Prasyarat</h3>
            {prereqs.length > 0 && (
              <ul className="-mx-2 mt-1 divide-y divide-stroke-soft-200">
                {prereqs.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left text-[14px] leading-5 text-text-strong-950 transition-colors hover:bg-bg-weak-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-base"
                      onClick={() => select(item.id)}
                      aria-label={"Buka detail " + item.title}
                    >
                      <span className="min-w-0">{item.title}</span>
                      <RiArrowRightLine
                        className="size-4 shrink-0 text-text-sub-600"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {requirements.map((item) => (
              <p key={item} className="mb-0 mt-2 text-paragraph-sm text-text-sub-600">
                {item}
              </p>
            ))}
          </section>
        )}
        {next.length > 0 && (
          <section className="mt-5">
            <h3 className="m-0 text-label-sm text-text-strong-950">Menjadi prasyarat untuk</h3>
            <ul className="-mx-2 mt-1 divide-y divide-stroke-soft-200">
              {next.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left text-[14px] leading-5 text-text-strong-950 transition-colors hover:bg-bg-weak-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-base"
                    onClick={() => select(item.id)}
                    aria-label={"Buka detail " + item.title}
                  >
                    <span className="min-w-0">{item.title}</span>
                    <RiArrowRightLine
                      className="size-4 shrink-0 text-text-sub-600"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </AlignDrawer.Body>
    </AlignDrawer.Content>
  );
}
