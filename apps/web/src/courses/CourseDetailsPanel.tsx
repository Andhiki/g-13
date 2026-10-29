import { useLocale } from "../useLocale";
import { Typography } from "../ui/typography";
import { useMemo } from "react";
import { RiArrowRightLine, RiArrowRightUpLine } from "@remixicon/react";
import { AlignBadge } from "../ui/badge";
import { AlignDrawer } from "../ui/drawer";
import { syllabusPoints } from "./syllabus-format";
import * as Accordion from "../ui/accordion";
import {
  getSyllabus,
  type Syllabus,
  getPrerequisites,
  type Course,
  type Curriculum,
} from "@g13/curriculum";
import { courseLabels, creditsFor, semesterLabel } from "./course-utils";
import { SemesterIndicator } from "./SemesterIndicator";
import { CopyCourseButton } from "./CopyCourseButton";

import type { CourseDetailsProps } from "./CourseDetails";

export function CourseDetailsPanel({
  course,
  data,
  relations,
  select,
  footer,
}: Pick<CourseDetailsProps, "data" | "relations" | "select" | "footer"> & { course: Course }) {
  const { text, courseName } = useLocale();
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
  const requirements = getPrerequisites(data.id, course).unresolved;
  const credit = creditsFor(course);
  return (
    <>
      <AlignDrawer.Header className="shrink-0 items-start gap-4 p-4 pt-0 sm:p-5">
        <div className="min-w-0 flex-1">
          <Typography as="p" variant="caption" className="m-0 text-text-sub-600">
            {course.code || text("Mata kuliah pilihan")}
          </Typography>
          <div className="mt-2 flex items-center gap-3">
            {credit !== null && (
              <span
                role="img"
                aria-label={text("{{v0}} SKS", { v0: credit })}
                className="flex size-[34px] shrink-0 items-center justify-center rounded-full border border-stroke-sub-300 text-text-strong-950"
              >
                <Typography as="span" variant="label" className="font-display" aria-hidden="true">
                  {credit}
                </Typography>
              </span>
            )}
            <AlignDrawer.Title asChild>
              <Typography as="h2" variant="subtitle1" className="m-0 min-w-0 text-text-strong-950">
                {courseName(course)}
              </Typography>
            </AlignDrawer.Title>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" aria-label={text("Kategori mata kuliah")}>
            {labels.map((label) => (
              <AlignBadge.Root
                variant="light"
                className="h-auto min-h-5 py-0.5 text-[12px] leading-4 font-medium"
                key={label}
              >
                {text(label)}
              </AlignBadge.Root>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 pr-8">
          <CopyCourseButton key={course.id} value={course.id} label={text("ID mata kuliah")} />
        </div>
      </AlignDrawer.Header>
      <AlignDrawer.Description asChild>
        <Typography as="p" variant="caption" className="sr-only">
          {text("Informasi akademik mata kuliah")} {courseName(course)}.
        </Typography>
      </AlignDrawer.Description>
      <AlignDrawer.Body className="min-h-0 overflow-y-auto">
        <div className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
          <div className="mb-6">
            {credit === null && (
              <Typography as="p" variant="caption" className="mt-2 text-text-sub-600">
                {text("SKS belum dinyatakan")}
              </Typography>
            )}
            <SemesterIndicator label={semesterLabel(course, text)} />
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
                      {text("Silabus")}
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
                {text("Prasyarat")}
              </Typography>
              {prereqs.length > 0 && (
                <ul className="-mx-2 divide-y divide-stroke-soft-200">
                  {prereqs.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left text-text-strong-950 transition-colors hover:bg-bg-weak-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-base"
                        onClick={() => select(item.id)}
                        aria-label={text("Buka detail ") + courseName(item)}
                      >
                        <Typography as="span" className="min-w-0">
                          {courseName(item)}
                        </Typography>
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
                  {text(item)}
                </Typography>
              ))}
            </section>
          )}
          {next.length > 0 && (
            <section className="mt-4 border-t border-stroke-soft-200 pt-2">
              <Typography as="h3" variant="subtitle2" className="m-0 py-3 text-text-strong-950">
                {text("Menjadi prasyarat untuk")}
              </Typography>
              <ul className="-mx-2 divide-y divide-stroke-soft-200">
                {next.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left text-text-strong-950 transition-colors hover:bg-bg-weak-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-base"
                      onClick={() => select(item.id)}
                      aria-label={text("Buka detail ") + courseName(item)}
                    >
                      <Typography as="span" className="min-w-0">
                        {courseName(item)}
                      </Typography>
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
    </>
  );
}

function CourseSyllabus({ data, code }: { data: Curriculum; code: string }) {
  const { text } = useLocale();
  const syllabus = getSyllabus(data.id, code);
  const versions = syllabus ? [syllabus, ...(syllabus.alternatives ?? [])] : [];
  return (
    <>
      {syllabus ? (
        <>
          {versions.length > 1 && (
            <Typography as="p" variant="caption" className="mt-3 text-text-sub-600">
              {text("Dokumen kurikulum memuat")} {versions.length}{" "}
              {text("versi silabus untuk kode ini. Keduanya ditampilkan sesuai halaman sumber.")}
            </Typography>
          )}
          {versions.map((version) => (
            <div key={version.pdfPage}>
              {versions.length > 1 && (
                <Typography as="p" variant="label" className="mt-4">
                  {text("Versi sumber — halaman cetak")} {version.printedPage}
                </Typography>
              )}
              <SyllabusContent syllabus={version} sourceTitle={data.sourceTitle} />
            </div>
          ))}
        </>
      ) : (
        <Typography as="p" variant="paragraph">
          {text("Silabus mata kuliah ini belum tersedia dalam data kurikulum")} {data.id}.
        </Typography>
      )}
    </>
  );
}

function SyllabusContent({ syllabus, sourceTitle }: { syllabus: Syllabus; sourceTitle: string }) {
  const { text } = useLocale();
  const topics = syllabusPoints(syllabus.syllabus);
  return (
    <>
      <Typography as="p" variant="caption" className="mb-4 mt-3 text-text-sub-600">
        {text("sourceText")}
      </Typography>
      {syllabus.description && (
        <>
          <Typography as="h3" variant="subtitle2" className="mt-3 text-text-strong-950">
            {text("Tujuan pembelajaran")}
          </Typography>
          <Typography as="p" variant="paragraph" className="mt-2" lang="id">
            {syllabus.description}
          </Typography>
        </>
      )}
      {topics.length > 1 ? (
        <ul aria-label={text("Pokok bahasan")} lang="id" className="list-disc space-y-1 pl-5">
          {topics.map((topic, index) => (
            <li key={index}>
              <Typography as="span" variant="paragraph">
                {topic}
              </Typography>
            </li>
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
            {text("Referensi")}
          </Typography>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {syllabus.references.map((reference, index) => (
              <li key={index} className="pl-1">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(reference)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-base underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-base"
                  aria-label={text("{{v0}} (cari di Google, tab baru)", { v0: reference })}
                >
                  <Typography as="span" variant="paragraph">
                    {reference}
                  </Typography>{" "}
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
        {text("Sumber:")} {sourceTitle}
        {text(", halaman cetak")} {syllabus.printedPage} {text("(halaman PDF")} {syllabus.pdfPage}
        ).
      </Typography>
    </>
  );
}
