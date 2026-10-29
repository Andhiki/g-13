import type { Course, Curriculum, Placement } from "./contracts/model";
type Section = Placement["section"];

type SourceReference = {
  printed_page?: number | null;
  pdf_page?: number | null;
  pdf_page_1_based?: number | null;
};

export const text = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

export const slug = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function semester(value: unknown) {
  const label = text(value),
    match = label.match(/(?:^|\b)([1-8])(?:\b|$)/);
  return { number: match ? Number(match[1]) : null, label };
}

export function makePlacement(
  section: Section,
  label: string,
  group: string,
  groupKind: Placement["groupKind"],
  sem: unknown,
  credits: unknown,
  prereq: unknown,
  refs: SourceReference[] | null,
  page?: SourceReference,
): Placement {
  const s = semester(sem),
    list = refs ?? (page ? [page] : []),
    ref = list[0] ?? {};
  return {
    section,
    label,
    group,
    groupKind,
    semester: s.number,
    semesterLabel: s.label,
    credits:
      (typeof credits !== "number" && typeof credits !== "string") ||
      (typeof credits === "string" && !credits.trim())
        ? null
        : Number.isFinite(Number(credits)) && Number(credits) >= 0
          ? Number(credits)
          : null,
    prerequisiteRaw: text(prereq),
    printedPage: ref.printed_page ?? null,
    pdfPage: ref.pdf_page ?? ref.pdf_page_1_based ?? null,
  };
}

export function merge(
  rows: { id: string; code: string; title: string; englishTitle: string; placement: Placement }[],
): Course[] {
  const map = new Map<string, Course>();
  for (const row of rows) {
    const course = map.get(row.id);
    if (!course)
      map.set(row.id, {
        id: row.id,
        code: row.code,
        title: text(row.title.replace(/\p{Co}/gu, "")),
        englishTitle: text(row.englishTitle.replace(/\p{Co}/gu, "")),
        placements: [row.placement],
      });
    else if (
      !course.placements.some((item) => JSON.stringify(item) === JSON.stringify(row.placement))
    )
      course.placements.push(row.placement);
  }
  return [...map.values()].sort(
    (a, b) =>
      Math.min(...a.placements.map((x) => x.semester ?? 99)) -
        Math.min(...b.placements.map((x) => x.semester ?? 99)) ||
      a.title.localeCompare(b.title, "id"),
  );
}

export function groupsFor(courses: Course[]): Curriculum["groups"] {
  const map = new Map<string, { ids: Set<string>; kind: Placement["groupKind"] }>();
  for (const course of courses)
    for (const item of course.placements) {
      if (item.section === "core") continue;
      const group = map.get(item.group) ?? { ids: new Set<string>(), kind: item.groupKind };
      group.ids.add(course.id);
      map.set(item.group, group);
    }
  return [...map]
    .map(([name, { ids, kind }]) => ({ name, count: ids.size, kind }))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}
