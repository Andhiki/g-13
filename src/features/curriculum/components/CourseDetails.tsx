import { useMemo, useState } from "react";
import { RiCloseLine } from "@remixicon/react";
import { AlignButton } from "../../../ui/button";
import { AlignBadge } from "../../../ui/badge";
import { AlignDrawer } from "../../../ui/drawer";
import { CompactButton } from "../../../ui/compact-button";
import type { Course, Curriculum, Relation } from "../../../data";
import {
  courseLabels,
  creditsFor,
  requirementText,
  semesterLabel,
  sourceLocation,
} from "../course-utils";

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
  const requirements = requirementText(course);
  const locations = sourceLocation(course);
  const credit = creditsFor(course);
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
      <AlignDrawer.Header className="border-b">
        <div className="min-w-0 flex-1">
          <p className="m-0 text-paragraph-xs text-text-sub-600">
            Kurikulum {data.id} · {data.edition} · {course.code || "Mata kuliah pilihan"}
          </p>
          <AlignDrawer.Title className="mt-1 line-clamp-2 text-label-lg text-text-strong-950">
            {course.title}
          </AlignDrawer.Title>
        </div>
        <AlignDrawer.Close asChild>
          <CompactButton aria-label="Tutup detail mata kuliah">
            <RiCloseLine aria-hidden="true" />
          </CompactButton>
        </AlignDrawer.Close>
      </AlignDrawer.Header>
      <AlignDrawer.Description className="sr-only">
        Informasi akademik dan sumber mata kuliah {course.title}.
      </AlignDrawer.Description>
      <AlignDrawer.Body className="overflow-y-auto p-5">
        {course.englishTitle && (
          <p className="mb-4 text-paragraph-sm text-text-sub-600">{course.englishTitle}</p>
        )}
        <div className="flex flex-wrap gap-2" aria-label="Kategori mata kuliah">
          {labels.map((label) => (
            <AlignBadge.Root variant="light" key={label}>
              {label}
            </AlignBadge.Root>
          ))}
        </div>
        <dl className="mt-5 grid grid-cols-2 divide-x divide-stroke-soft-200 border-y border-stroke-soft-200 py-3">
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
        <section className="mt-5">
          <h3 className="m-0 text-label-sm text-text-strong-950">Prasyarat pada sumber</h3>
          {requirements.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-paragraph-sm text-text-sub-600">
              {requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-paragraph-sm text-text-sub-600">
              Tabel sumber tidak mencantumkan prasyarat mata kuliah untuk baris ini.
            </p>
          )}
          <p className="mb-0 mt-3 text-paragraph-xs text-text-sub-600">
            Teks sumber dipertahankan apa adanya. Peta ini tidak menghitung kelayakan registrasi
            pribadi.
          </p>
        </section>
        {(prereqs.length > 0 || next.length > 0) && (
          <section className="mt-5">
            <h3 className="m-0 text-label-sm text-text-strong-950">Relasi nama yang cocok</h3>
            {prereqs.length > 0 && (
              <div className="mt-3">
                <h4 className="m-0 text-paragraph-xs text-text-sub-600">Prasyarat</h4>
                <ul className="mt-1 divide-y divide-stroke-soft-200">
                  {prereqs.map((item) => (
                    <li className="flex items-center justify-between gap-3 py-2" key={item.id}>
                      <span className="text-paragraph-sm text-text-strong-950">{item.title}</span>
                      <AlignButton.Root
                        variant="neutral"
                        mode="ghost"
                        size="xsmall"
                        onClick={() => select(item.id)}
                        aria-label={"Buka detail " + item.title}
                      >
                        Buka
                      </AlignButton.Root>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {next.length > 0 && (
              <div className="mt-3">
                <h4 className="m-0 text-paragraph-xs text-text-sub-600">
                  Dirujuk sebagai prasyarat oleh
                </h4>
                <ul className="mt-1 divide-y divide-stroke-soft-200">
                  {next.map((item) => (
                    <li className="flex items-center justify-between gap-3 py-2" key={item.id}>
                      <span className="text-paragraph-sm text-text-strong-950">{item.title}</span>
                      <AlignButton.Root
                        variant="neutral"
                        mode="ghost"
                        size="xsmall"
                        onClick={() => select(item.id)}
                        aria-label={"Buka detail " + item.title}
                      >
                        Buka
                      </AlignButton.Root>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
        <section className="mt-5 border-t border-stroke-soft-200 pt-4">
          <h3 className="m-0 text-label-sm text-text-strong-950">Lokasi sumber</h3>
          <p className="mb-0 mt-2 text-paragraph-sm text-text-sub-600">{data.sourceTitle}</p>
          {locations.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-paragraph-sm text-text-sub-600">
              {locations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mb-0 mt-2 text-paragraph-sm text-text-sub-600">
              Lokasi baris belum dipetakan.
            </p>
          )}
        </section>
        <details className="mt-5 border-t border-stroke-soft-200 pt-4">
          <summary className="cursor-pointer text-label-sm text-text-strong-950">
            Cara membaca kurikulum {data.id}
          </summary>
          {data.readingNotes.map((note, index) => (
            <p className="mb-0 mt-3 text-paragraph-sm text-text-sub-600" key={index}>
              {note}
            </p>
          ))}
        </details>
      </AlignDrawer.Body>
    </AlignDrawer.Content>
  );
}
