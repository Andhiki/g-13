import { useLocale } from "@/useLocale";
import { CopyCourseButton } from "@/courses/CopyCourseButton";
import { Typography } from "@/ui/typography";
import { useId } from "react";
import { AlignBadge } from "@/ui/badge";
import { AlignButton } from "@/ui/button";
import { AlignTable } from "@/ui/table";
import { courseLabels, semesterLabel } from "@/courses/course-utils";
import type { CourseSection } from "../shared/list-groups";

function describeCourseRow(
  course: CourseSection["courses"][number],
  sectionKind: CourseSection["kind"],
  text: ReturnType<typeof useLocale>["text"],
) {
  const categoryLabels = courseLabels(course).map((label) => text(label));
  const semesterLabels = new Set(course.placements.map((placement) => placement.semesterLabel));
  const showSemesters =
    sectionKind === "electives" ||
    semesterLabels.size > 1 ||
    course.placements.some(
      (placement) =>
        placement.semesterLabel && placement.semesterLabel !== String(placement.semester),
    );
  const groupNames = new Set(
    course.placements
      .filter((placement) => placement.groupKind === "interest" || placement.groupKind === "other")
      .map((placement) => placement.group)
      .filter(Boolean),
  );
  const creditValues = new Set(
    course.placements
      .map((placement) => placement.credits)
      .filter((value): value is number => value !== null),
  );
  return {
    categoryLabels,
    categories: categoryLabels.join(" · "),
    showSemesters,
    groups: [...groupNames].map((group) => text(group)).join(" · "),
    credits: [...creditValues].sort((left, right) => left - right).join(" / "),
  };
}

function CourseCodeCell({ code }: { code: string }) {
  const { text } = useLocale();
  return (
    <AlignTable.Cell className="h-10 max-[640px]:hidden">
      <div className="flex items-center gap-1 whitespace-nowrap">
        {code && <CopyCourseButton value={code} label={text("kode mata kuliah")} />}
        <Typography as="span" variant="caption" color="muted">
          {code || "—"}
        </Typography>
      </div>
    </AlignTable.Cell>
  );
}

function CourseMobileMeta({
  code,
  categoryLabels,
  groups,
}: {
  code: string;
  categoryLabels: string[];
  groups: string;
}) {
  const { text } = useLocale();
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 min-[640px]:hidden">
      {code && (
        <div className="inline-flex items-center gap-1">
          <CopyCourseButton value={code} label={text("kode mata kuliah")} />
          <Typography as="span" variant="code" color="muted">
            {code}
          </Typography>
        </div>
      )}
      {categoryLabels.map((label) => (
        <AlignBadge.Root key={label} variant="light" size="medium" shape="tag">
          {label}
        </AlignBadge.Root>
      ))}
      {groups && (
        <Typography as="span" variant="caption" color="muted">
          {groups}
        </Typography>
      )}
    </div>
  );
}

function CourseTableRow({
  course,
  sectionKind,
  selected,
  onSelect,
}: {
  course: CourseSection["courses"][number];
  sectionKind: CourseSection["kind"];
  selected: boolean;
  onSelect: () => void;
}) {
  const { text, courseName } = useLocale();
  const { categoryLabels, categories, showSemesters, groups, credits } = describeCourseRow(
    course,
    sectionKind,
    text,
  );
  return (
    <AlignTable.Row
      className="cursor-[var(--interactive-cursor)] max-[640px]:border-b max-[640px]:border-stroke-soft-200"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        onSelect();
      }}
    >
      <CourseCodeCell code={course.code} />
      <AlignTable.Cell className="h-10">
        <AlignButton.Root
          variant="link"
          size="small"
          className="min-h-9 w-full justify-start whitespace-normal text-left"
          aria-label={text("Buka detail {{v0}}", { v0: courseName(course) })}
          aria-pressed={selected}
          onClick={onSelect}
        >
          <Typography as="span" variant="label" color="strong">
            {courseName(course)}
          </Typography>
        </AlignButton.Root>
        <CourseMobileMeta code={course.code} categoryLabels={categoryLabels} groups={groups} />
        {showSemesters && (
          <Typography as="span" variant="caption" color="muted" className="mb-1 block">
            {semesterLabel(course, text)}
          </Typography>
        )}
      </AlignTable.Cell>
      <AlignTable.Cell className="h-10 max-[640px]:hidden">
        <Typography as="span" variant="caption" color="muted" className="block">
          {categories}
        </Typography>
        {groups && (
          <Typography as="span" variant="caption" color="muted" className="block">
            {groups}
          </Typography>
        )}
      </AlignTable.Cell>
      <AlignTable.Cell className="h-10 whitespace-nowrap text-right max-[640px]:align-top max-[640px]:pt-3">
        <Typography as="span" variant="paragraph" color="muted" className="tabular-nums">
          {credits || "—"}
          <span className="min-[640px]:hidden"> {text("SKS")}</span>
        </Typography>
      </AlignTable.Cell>
    </AlignTable.Row>
  );
}

export function CourseTable({
  section,
  selectedId,
  select,
}: {
  section: CourseSection;
  selectedId: string | null;
  select: (id: string) => void;
}) {
  const { text } = useLocale();
  const headingId = useId();

  return (
    <section
      id={section.id}
      data-semester={section.kind === "semester" ? section.id.replace("semester-", "") : undefined}
      aria-labelledby={headingId}
    >
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <Typography as="h2" variant="subtitle2" color="strong" id={headingId} className="m-0">
          {text(section.title)}
        </Typography>
        <Typography as="span" variant="caption" color="muted">
          {text("courseCount", { count: section.courses.length })}
        </Typography>
      </div>
      <AlignTable.Root aria-labelledby={headingId}>
        <AlignTable.Header>
          <AlignTable.Row>
            <AlignTable.Head scope="col" className="w-40 max-[640px]:hidden">
              {text("Kode")}
            </AlignTable.Head>
            <AlignTable.Head scope="col">{text("Mata kuliah")}</AlignTable.Head>
            <AlignTable.Head scope="col" className="w-44 max-[640px]:hidden">
              {text("Kategori")}
            </AlignTable.Head>
            <AlignTable.Head scope="col" className="w-16 text-right">
              {text("SKS")}
            </AlignTable.Head>
          </AlignTable.Row>
        </AlignTable.Header>
        <AlignTable.Body>
          {section.courses.map((course) => (
            <CourseTableRow
              key={course.id}
              course={course}
              sectionKind={section.kind}
              selected={selectedId === course.id}
              onSelect={() => select(course.id)}
            />
          ))}
        </AlignTable.Body>
      </AlignTable.Root>
    </section>
  );
}
