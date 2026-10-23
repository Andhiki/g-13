export type CurriculumId = "2021" | "2026";
type Section = "core" | "interest" | "elective";

export type Placement = {
  section: Section;
  label: string;
  group: string;
  semester: number | null;
  semesterLabel: string;
  credits: number | null;
  prerequisiteRaw: string;
  printedPage: number | null;
  pdfPage: number | null;
};

export type Course = {
  id: string;
  code: string;
  title: string;
  englishTitle: string;
  placements: Placement[];
};

export type Curriculum = {
  id: CurriculumId;
  edition: string;
  all: Course[];
  core: Course[];
  electives: Course[];
  groups: { name: string; count: number }[];
  requiredCredits: number;
  totalCredits: number;
  summary: string;
  sourceTitle: string;
  sourceUrl: string | null;
  readingNotes: string[];
};

export type Raw = Record<string, any>;

export const text = (value: unknown) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

export const slug = (value: string) =>
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
  sem: unknown,
  credits: unknown,
  prereq: unknown,
  refs: unknown,
  page?: Raw,
): Placement {
  const s = semester(sem),
    list = Array.isArray(refs) ? refs : refs ? [refs] : page ? [page] : [],
    ref = list[0] ?? {};
  return {
    section,
    label,
    group,
    semester: s.number,
    semesterLabel: s.label,
    credits: Number.isFinite(Number(credits)) ? Number(credits) : null,
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
        title: row.title,
        englishTitle: row.englishTitle,
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

export function groupsFor(courses: Course[]) {
  const map = new Map<string, Set<string>>();
  for (const course of courses)
    for (const item of course.placements) {
      if (item.section === "core") continue;
      const ids = map.get(item.group) ?? new Set<string>();
      ids.add(course.id);
      map.set(item.group, ids);
    }
  return [...map]
    .map(([name, ids]) => ({ name, count: ids.size }))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}
