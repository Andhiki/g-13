import { Typography } from "../../../ui/typography";
import { useId } from "react";
import { AlignButton } from "../../../ui/button";
import { AlignTable } from "../../../ui/table";
import { courseLabels, semesterLabel } from "../course-utils";
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
  const headingId = useId();

  return (
    <section
      id={section.id}
      data-semester={section.kind === "semester" ? section.id.replace("semester-", "") : undefined}
      aria-labelledby={headingId}
    >
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <Typography as="h2" variant="subtitle2" id={headingId} className="m-0 text-text-strong-950">
          {section.title}
        </Typography>
        <Typography as="span" variant="caption" className="text-text-sub-600">
          {section.courses.length} mata kuliah
        </Typography>
      </div>
      <AlignTable.Root aria-labelledby={headingId}>
        <AlignTable.Header>
          <AlignTable.Row>
            <AlignTable.Head scope="col" className="w-28 max-[640px]:hidden">
              Kode
            </AlignTable.Head>
            <AlignTable.Head scope="col">Mata kuliah</AlignTable.Head>
            <AlignTable.Head scope="col" className="w-16 text-right">
              SKS
            </AlignTable.Head>
            <AlignTable.Head scope="col" className="w-44 max-[640px]:hidden">
              Kategori
            </AlignTable.Head>
          </AlignTable.Row>
        </AlignTable.Header>
        <AlignTable.Body>
          {section.courses.map((course) => {
            const categories = courseLabels(course).join(" · ");
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
            ].join(" · ");
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
              <AlignTable.Row key={course.id}>
                <AlignTable.Cell className="max-[640px]:hidden">
                  <Typography as="span" variant="caption" className="text-text-sub-600">
                    {course.code || "—"}
                  </Typography>
                </AlignTable.Cell>
                <AlignTable.Cell>
                  <AlignButton.Root
                    variant="neutral"
                    mode="ghost"
                    size="small"
                    className="h-auto min-h-9 w-full justify-start whitespace-normal px-0 py-1 text-left"
                    aria-label={`Buka detail ${course.title}`}
                    aria-pressed={selectedId === course.id}
                    onClick={() => select(course.id)}
                  >
                    <Typography as="span" variant="label" className="text-text-strong-950">
                      {course.title}
                    </Typography>
                  </AlignButton.Root>
                  <Typography
                    as="span"
                    variant="caption"
                    className="mb-1 block text-text-sub-600 min-[640px]:hidden"
                  >
                    {[course.code, categories, groups].filter(Boolean).join(" · ")}
                  </Typography>
                  {showSemesters && (
                    <Typography
                      as="span"
                      variant="caption"
                      className="mb-1 block text-text-sub-600"
                    >
                      {semesterLabel(course)}
                    </Typography>
                  )}
                </AlignTable.Cell>
                <AlignTable.Cell className="text-right">
                  <Typography
                    as="span"
                    variant="paragraph"
                    className="text-text-sub-600 tabular-nums"
                  >
                    {credits || "—"}
                  </Typography>
                </AlignTable.Cell>
                <AlignTable.Cell className="max-[640px]:hidden">
                  <Typography as="span" variant="caption" className="block text-text-sub-600">
                    {categories}
                  </Typography>
                  {groups && (
                    <Typography as="span" variant="caption" className="block text-text-sub-600">
                      {groups}
                    </Typography>
                  )}
                </AlignTable.Cell>
              </AlignTable.Row>
            );
          })}
        </AlignTable.Body>
      </AlignTable.Root>
    </section>
  );
}
