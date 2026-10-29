import { useLocale } from "../../../useLocale";
import { CopyCourseButton } from "../../../courses/CopyCourseButton";
import { Typography } from "../../../ui/typography";
import { useId } from "react";
import { AlignButton } from "../../../ui/button";
import { AlignTable } from "../../../ui/table";
import { courseLabels, semesterLabel } from "../../../courses/course-utils";
import type { CourseSection } from "../list-groups";

export function CourseTable({
  section,
  selectedId,
  select,
}: {
  section: CourseSection;
  selectedId: string | null;
  select: (id: string) => void;
}) {
  const { text, courseName } = useLocale();
  const headingId = useId();

  return (
    <section
      id={section.id}
      data-semester={section.kind === "semester" ? section.id.replace("semester-", "") : undefined}
      aria-labelledby={headingId}
    >
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <Typography as="h2" variant="subtitle2" id={headingId} className="m-0 text-text-strong-950">
          {text(section.title)}
        </Typography>
        <Typography as="span" variant="caption" className="text-text-sub-600">
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
          {section.courses.map((course) => {
            const categories = courseLabels(course)
              .map((label) => text(label))
              .join(" · ");
            const semesterLabels = new Set(
              course.placements.map((placement) => placement.semesterLabel),
            );
            const showSemesters =
              section.kind === "electives" ||
              semesterLabels.size > 1 ||
              course.placements.some(
                (placement) =>
                  placement.semesterLabel && placement.semesterLabel !== String(placement.semester),
              );
            const groups = [
              ...new Set(course.placements.map((placement) => placement.group).filter(Boolean)),
            ]
              .map((group) => text(group))
              .join(" · ");
            const credits = [
              ...new Set(
                course.placements
                  .map((placement) => placement.credits)
                  .filter((value): value is number => value !== null),
              ),
            ]
              .sort((left, right) => left - right)
              .join(" / ");

            return (
              <AlignTable.Row
                key={course.id}
                className="cursor-pointer"
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("button")) return;
                  select(course.id);
                }}
              >
                <AlignTable.Cell className="h-10 max-[640px]:hidden">
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    {course.code && (
                      <CopyCourseButton value={course.code} label={text("kode mata kuliah")} />
                    )}
                    <Typography as="span" variant="caption" className="text-text-sub-600">
                      {course.code || "—"}
                    </Typography>
                  </div>
                </AlignTable.Cell>
                <AlignTable.Cell className="h-10">
                  <AlignButton.Root
                    variant="neutral"
                    mode="ghost"
                    size="small"
                    className="h-auto min-h-9 w-full justify-start whitespace-normal px-0 py-1 text-left"
                    aria-label={text("Buka detail {{v0}}", { v0: courseName(course) })}
                    aria-pressed={selectedId === course.id}
                    onClick={() => select(course.id)}
                  >
                    <Typography as="span" variant="label" className="text-text-strong-950">
                      {courseName(course)}
                    </Typography>
                  </AlignButton.Root>
                  <Typography
                    as="span"
                    variant="caption"
                    className="mb-1 flex flex-wrap items-center gap-1 text-text-sub-600 min-[640px]:hidden"
                  >
                    {course.code && (
                      <span className="inline-flex items-center gap-1">
                        <CopyCourseButton value={course.code} label={text("kode mata kuliah")} />
                        {course.code}
                      </span>
                    )}
                    {[categories, groups].filter(Boolean).join(" · ")}
                  </Typography>
                  {showSemesters && (
                    <Typography
                      as="span"
                      variant="caption"
                      className="mb-1 block text-text-sub-600"
                    >
                      {semesterLabel(course, text)}
                    </Typography>
                  )}
                </AlignTable.Cell>
                <AlignTable.Cell className="h-10 max-[640px]:hidden">
                  <Typography as="span" variant="caption" className="block text-text-sub-600">
                    {categories}
                  </Typography>
                  {groups && (
                    <Typography as="span" variant="caption" className="block text-text-sub-600">
                      {groups}
                    </Typography>
                  )}
                </AlignTable.Cell>
                <AlignTable.Cell className="h-10 text-right">
                  <Typography
                    as="span"
                    variant="paragraph"
                    className="text-text-sub-600 tabular-nums"
                  >
                    {credits || "—"}
                  </Typography>
                </AlignTable.Cell>
              </AlignTable.Row>
            );
          })}
        </AlignTable.Body>
      </AlignTable.Root>
    </section>
  );
}
