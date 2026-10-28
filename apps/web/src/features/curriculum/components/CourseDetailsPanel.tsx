import { Typography } from "../../../ui/typography";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { RiArrowRightLine, RiArrowRightUpLine, RiCloseLine } from "@remixicon/react";
import { AlignBadge } from "../../../ui/badge";
import { AlignDrawer } from "../../../ui/drawer";
import { syllabusPoints } from "../syllabus-format";
import * as Accordion from "../../../ui/accordion";
import {
  getSyllabus,
  type Syllabus,
  normalizeCourseTitle,
  type Course,
  type Curriculum,
  type Relation,
} from "@g13/curriculum";
import { CompactButton } from "../../../ui/compact-button";
import { courseLabels, creditsFor, requirementText, semesterLabel } from "../course-utils";
import { CourseSheetHandle } from "./CourseSheetHandle";
import { SemesterIndicator } from "./SemesterIndicator";
import { CopyCourseButton } from "./CopyCourseButton";

export type CourseDetailsProps = {
  course: Course | null;
  data: Curriculum;
  relations: Relation[];
  select: (id: string) => void;
  close: () => void;
  modal?: boolean;
  footer?: ReactNode;
  onHeightChange?: (height: number) => void;
};

export function CourseDetailsPanel({
  course,
  data,
  relations,
  select,
  close,
  modal = true,
  footer,
  onHeightChange,
}: CourseDetailsProps) {
  const [height, setHeight] = useState(30);
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
      {content && (
        <CourseDetailsContent
          {...content}
          select={select}
          modal={modal}
          footer={footer}
          height={height}
          onHeightChange={(next) => {
            setHeight(next);
            onHeightChange?.(next);
          }}
        />
      )}
    </AlignDrawer.Root>
  );
}

function CourseDetailsContent({
  course,
  data,
  relations,
  select,
  modal,
  footer,
  onHeightChange,
  height,
}: Omit<CourseDetailsProps, "course" | "close"> & { course: Course; height: number }) {
  const closeButton = useRef<HTMLButtonElement>(null);
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
  return (
    <AlignDrawer.Content
      modal={modal}
      style={{ "--course-sheet-height": `${height}dvh` } as CSSProperties}
      className="min-[650px]:top-[var(--app-header-height)] max-[650px]:fixed max-[650px]:inset-x-0 max-[650px]:top-auto max-[650px]:bottom-0 max-[650px]:h-[var(--course-sheet-height)] max-[650px]:max-w-none max-[650px]:rounded-t-10 max-[650px]:border-r-0 max-[650px]:border-t max-[650px]:data-[state=open]:slide-in-from-bottom-full max-[650px]:data-[state=closed]:slide-out-to-bottom-full max-[650px]:data-[state=open]:[--tw-enter-translate-x:0%] max-[650px]:data-[state=closed]:[--tw-exit-translate-x:0%]"
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        closeButton.current?.focus();
      }}
      onInteractOutside={modal ? undefined : (event) => event.preventDefault()}
      aria-label={`Detail ${course.title}`}
    >
      <CourseSheetHandle height={height} onChange={(next) => onHeightChange?.(next)} />
      <AlignDrawer.Header className="shrink-0 items-start gap-4 p-4 pt-0 sm:p-5">
        <div className="min-w-0 flex-1">
          <Typography as="p" variant="caption" className="m-0 text-text-sub-600">
            {course.code || "Mata kuliah pilihan"}
          </Typography>
          <div className="mt-2 flex items-center gap-3">
            {credit !== null && (
              <span
                role="img"
                aria-label={`${credit} SKS`}
                className="flex size-[34px] shrink-0 items-center justify-center rounded-full border border-stroke-sub-300 font-display text-label-sm text-text-strong-950"
              >
                <span aria-hidden="true">{credit}</span>
              </span>
            )}
            <AlignDrawer.Title asChild>
              <Typography as="h2" variant="subtitle1" className="m-0 min-w-0 text-text-strong-950">
                {course.title}
              </Typography>
            </AlignDrawer.Title>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Kategori mata kuliah">
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
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CopyCourseButton key={course.id} value={course.id} label="ID mata kuliah" />
          <AlignDrawer.Close asChild>
            <CompactButton ref={closeButton} aria-label="Tutup detail mata kuliah">
              <RiCloseLine className="size-5" aria-hidden="true" />
            </CompactButton>
          </AlignDrawer.Close>
        </div>
      </AlignDrawer.Header>
      <AlignDrawer.Description asChild>
        <Typography as="p" variant="caption" className="sr-only">
          Informasi akademik mata kuliah {course.title}.
        </Typography>
      </AlignDrawer.Description>
      <AlignDrawer.Body className="min-h-0 overflow-y-auto">
        <div className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
          <div className="mb-6">
            {credit === null && (
              <Typography as="p" variant="caption" className="mt-2 text-text-sub-600">
                SKS belum dinyatakan
              </Typography>
            )}
            <SemesterIndicator label={semesterLabel(course)} />
          </div>
          <div className="mt-2">
            <Accordion.Root
              key={`${data.id}-${course.id}`}
              type="single"
              collapsible
              defaultValue="syllabus"
            >
              <Accordion.Item value="syllabus">
                <Accordion.Header className="m-0 text-label-sm text-text-strong-950">
                  <Accordion.Trigger>
                    <Typography as="span" variant="subtitle1">
                      Silabus
                    </Typography>
                    <Accordion.Arrow aria-hidden="true" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content>
                  <CourseSyllabus
                    key={`${data.id}-${course.code}`}
                    data={data}
                    code={course.code}
                  />
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          </div>
          {(prereqs.length > 0 || requirements.length > 0) && (
            <section className="mt-4 border-t border-stroke-soft-200 pt-2">
              <Typography as="h3" variant="subtitle2" className="m-0 py-3 text-text-strong-950">
                Prasyarat
              </Typography>
              {prereqs.length > 0 && (
                <ul className="-mx-2 divide-y divide-stroke-soft-200">
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
                <Typography
                  as="p"
                  variant="paragraph"
                  key={item}
                  className="mb-0 mt-2 text-text-sub-600"
                >
                  {item}
                </Typography>
              ))}
            </section>
          )}
          {next.length > 0 && (
            <section className="mt-4 border-t border-stroke-soft-200 pt-2">
              <Typography as="h3" variant="subtitle2" className="m-0 py-3 text-text-strong-950">
                Menjadi prasyarat untuk
              </Typography>
              <ul className="-mx-2 divide-y divide-stroke-soft-200">
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
        </div>
      </AlignDrawer.Body>
      {footer && <div className="shrink-0 border-t border-stroke-soft-200 p-4">{footer}</div>}
    </AlignDrawer.Content>
  );
}

function CourseSyllabus({ data, code }: { data: Curriculum; code: string }) {
  const [result, setResult] = useState<
    | { status: "loading" }
    | { status: "error" }
    | { status: "loaded"; syllabus: Syllabus | undefined }
  >({ status: "loading" });
  useEffect(() => {
    let active = true;
    setResult({ status: "loading" });
    void getSyllabus(data.id, code).then(
      (syllabus) => {
        if (active) setResult({ status: "loaded", syllabus });
      },
      () => {
        if (active) setResult({ status: "error" });
      },
    );
    return () => {
      active = false;
    };
  }, [data.id, code]);
  if (result.status === "loading") return <p role="status">Memuat silabus…</p>;
  if (result.status === "error")
    return (
      <div role="alert">
        <p>Silabus gagal dimuat. Periksa koneksi internet.</p>
        <button
          type="button"
          className="min-h-11 text-primary-base underline"
          onClick={() => window.location.reload()}
        >
          Muat ulang
        </button>
      </div>
    );
  const { syllabus } = result;
  const versions = syllabus ? [syllabus, ...(syllabus.alternatives ?? [])] : [];
  return (
    <>
      {syllabus ? (
        <>
          {versions.length > 1 && (
            <Typography as="p" variant="caption" className="mt-3 text-text-sub-600">
              Dokumen kurikulum memuat {versions.length} versi silabus untuk kode ini. Keduanya
              ditampilkan sesuai halaman sumber.
            </Typography>
          )}
          {versions.map((version) => (
            <div key={version.pdfPage}>
              {versions.length > 1 && (
                <Typography as="p" variant="label" className="mt-4">
                  Versi sumber — halaman cetak {version.printedPage}
                </Typography>
              )}
              <SyllabusContent syllabus={version} sourceTitle={data.sourceTitle} />
            </div>
          ))}
        </>
      ) : (
        <Typography as="p" variant="paragraph">
          Silabus mata kuliah ini belum tersedia dalam data kurikulum {data.id}.
        </Typography>
      )}
    </>
  );
}

function SyllabusContent({ syllabus, sourceTitle }: { syllabus: Syllabus; sourceTitle: string }) {
  const topics = syllabusPoints(syllabus.syllabus);
  return (
    <>
      {syllabus.description && (
        <>
          <Typography as="h3" variant="subtitle2" className="mt-3 text-text-strong-950">
            Tujuan pembelajaran
          </Typography>
          <Typography as="p" variant="paragraph" className="mt-2">
            {syllabus.description}
          </Typography>
        </>
      )}
      {topics.length > 1 ? (
        <ul aria-label="Pokok bahasan" className="list-disc space-y-1 pl-5 text-paragraph-sm">
          {topics.map((topic, index) => (
            <li key={index}>{topic}</li>
          ))}
        </ul>
      ) : (
        <Typography as="p" variant="paragraph">
          {syllabus.syllabus}
        </Typography>
      )}
      {syllabus.references.length > 0 && (
        <>
          <Typography as="h3" variant="subtitle2" className="mt-4 text-text-strong-950">
            Referensi
          </Typography>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-paragraph-sm">
            {syllabus.references.map((reference, index) => (
              <li key={index} className="pl-1">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(reference)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-base underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-base"
                  aria-label={`${reference} (cari di Google, tab baru)`}
                >
                  {reference}{" "}
                  <RiArrowRightUpLine
                    className="inline-block size-3.5 align-text-bottom"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      <Typography as="p" variant="caption" className="mt-4 ">
        Sumber: {sourceTitle}, halaman cetak {syllabus.printedPage} (halaman PDF {syllabus.pdfPage}
        ).
      </Typography>
    </>
  );
}
