import { archiveSource, examArchive } from "./catalog";
import type { ArchiveLocation, ExamCourse, ExamPaper } from "./contracts";
import type { ArchiveSearch } from "./search";

function oneTypoApart(query: string, title: string) {
  const left = [...query];
  const right = [...title];
  if (Math.abs(left.length - right.length) > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i++;
      j++;
    } else {
      if (edits === 1) return false;
      edits = 1;
      if (left.length === right.length && left[i] === right[j + 1] && left[i + 1] === right[j]) {
        i += 2;
        j += 2;
      } else if (left.length === right.length) {
        i++;
        j++;
      } else if (left.length < right.length) {
        j++;
      } else {
        i++;
      }
    }
  }
  return edits + left.length - i + right.length - j <= 1;
}

const aliases: Record<string, string[]> = { "Basis Data": ["basdat"] };

function tokens(value: string, locale: string) {
  return value.toLocaleLowerCase(locale).match(/[\p{L}\p{N}]+/gu) ?? [];
}

export function prepareCourseSearch(
  catalog: readonly ExamCourse[],
  displayName: (course: ExamCourse) => string,
  locale: string,
) {
  return catalog.map((course) => ({
    course,
    name: displayName(course),
    names: [course.name, displayName(course), ...(aliases[course.name] ?? [])].map((name) =>
      tokens(name, locale),
    ),
  }));
}

function wordScore(query: string, word: string) {
  if (query === word) return 0;
  if (word.startsWith(query)) return 1;
  if (word.includes(query)) return 2;
  if (query.length < 4) return Infinity;
  if (oneTypoApart(query, word)) return 3;
  if (
    [query.length - 1, query.length, query.length + 1].some(
      (length) => length < word.length && oneTypoApart(query, word.slice(0, length)),
    )
  )
    return 4;
  return Infinity;
}

function nameScore(query: string[], name: string[]) {
  if (query.length > name.length) return Infinity;
  function assign(index: number, used: Set<number>): number {
    if (index === query.length) return 0;
    let best = Infinity;
    for (let i = 0; i < name.length; i++) {
      if (used.has(i)) continue;
      const score = wordScore(query[index], name[i]);
      if (!Number.isFinite(score)) continue;
      used.add(i);
      best = Math.min(best, score + assign(index + 1, used));
      used.delete(i);
    }
    return best;
  }
  const score = assign(0, new Set());
  return score === 0 && query.join(" ") === name.join(" ") ? -1 : score;
}

type ArchiveEntry =
  | {
      kind: "folder";
      id: string;
      name: string;
      location: ArchiveLocation;
      createdAt: string | null;
    }
  | { kind: "paper"; id: string; name: string; paper: ExamPaper; createdAt: string | null };

export function browseArchive({
  location,
  query = "",
  catalog = examArchive,
  displayName = (course: ExamCourse) => course.name,
  locale = "id",
  searchIndex,
}: {
  location: ArchiveLocation;
  query?: string;
  catalog?: readonly ExamCourse[];
  displayName?: (course: ExamCourse) => string;
  locale?: string;
  searchIndex?: ReturnType<typeof prepareCourseSearch>;
}) {
  const breadcrumbs: { name: string; location: ArchiveLocation }[] = [
    { name: "Arsip Ujian", location: [] },
  ];
  const course = catalog.find((entry) => entry.id === location[0]);
  let entries: ArchiveEntry[];
  if (!course) {
    const search = tokens(query, locale);
    const hasQuery = query.trim().length > 0;
    entries = (searchIndex ?? prepareCourseSearch(catalog, displayName, locale))
      .map((entry) => ({
        ...entry,
        score: hasQuery
          ? search.length
            ? Math.min(
                ...entry.names.map((name, index) => nameScore(search, name) + (index >= 2 ? 2 : 0)),
              )
            : Infinity
          : 0,
      }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, locale, { numeric: true }))
      .map((entry) => ({
        kind: "folder",
        id: entry.course.id,
        name: entry.name,
        location: [entry.course.id],
        createdAt: entry.course.createdAt,
      }));
    return { breadcrumbs, entries };
  } else {
    breadcrumbs.push({ name: displayName(course), location: [course.id] });
    const year = course.years.find((entry) => entry.name === location[1]);
    if (!year) {
      entries = [...course.years]
        .sort(
          (a, b) =>
            Number(a.name === "Tanpa tahun") - Number(b.name === "Tanpa tahun") ||
            b.name.localeCompare(a.name, "id", { numeric: true }),
        )
        .map((entry) => ({
          kind: "folder",
          id: entry.name,
          name: entry.name,
          location: [course.id, entry.name],
          createdAt: entry.createdAt,
        }));
      return { breadcrumbs, entries };
    }
    breadcrumbs.push({ name: year.name, location: [course.id, year.name] });
    entries = year.papers.map((paper) => ({
      kind: "paper",
      id: paper.id,
      name: paper.name,
      paper,
      createdAt: paper.createdAt,
    }));
  }
  return {
    breadcrumbs,
    entries: entries.sort((a, b) => a.name.localeCompare(b.name, locale, { numeric: true })),
  };
}

export function paperLinks(paper: ExamPaper) {
  const base = `https://drive.google.com/file/d/${encodeURIComponent(paper.id)}`;
  return {
    preview: `${base}/preview`,
    drive: `${base}/view`,
    download: `https://drive.google.com/uc?export=download&id=${encodeURIComponent(paper.id)}`,
  };
}

export function resolveArchive(
  search: ArchiveSearch,
  catalog: readonly ExamCourse[] = examArchive,
): { location: ArchiveLocation; paper: ExamPaper | null } {
  const course = catalog.find((entry) => entry.id === search.course);
  if (!course) return { location: [], paper: null };
  const year = course.years.find((entry) => entry.name === search.year);
  if (!year) return { location: [course.id], paper: null };
  return {
    location: [course.id, year.name],
    paper: year.papers.find((entry) => entry.id === search.file) ?? null,
  };
}

export { archiveSource };
