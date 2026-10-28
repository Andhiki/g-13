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
      if (left[i] === right[j + 1] && left[i + 1] === right[j]) {
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

function matchesCourseName(name: string, query: string) {
  const words = query.split(/\s+/);
  if (name.includes(query)) return true;
  const titleWords = name.match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.every((word) => {
    const match = titleWords.findIndex(
      (titleWord) =>
        titleWord.includes(word) || (word.length >= 4 && oneTypoApart(word, titleWord)),
    );
    if (match === -1) return false;
    titleWords.splice(match, 1);
    return true;
  });
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
}: {
  location: ArchiveLocation;
  query?: string;
  catalog?: readonly ExamCourse[];
}) {
  const breadcrumbs: { name: string; location: ArchiveLocation }[] = [
    { name: "Arsip Ujian", location: [] },
  ];
  const course = catalog.find((entry) => entry.id === location[0]);
  let entries: ArchiveEntry[];
  if (!course) {
    const search = query.trim().toLocaleLowerCase("id");
    entries = catalog
      .filter((entry) => matchesCourseName(entry.name.toLocaleLowerCase("id"), search))
      .map((entry) => ({
        kind: "folder",
        id: entry.id,
        name: entry.name,
        location: [entry.id],
        createdAt: entry.createdAt,
      }));
  } else {
    breadcrumbs.push({ name: course.name, location: [course.id] });
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
    entries: entries.sort((a, b) => a.name.localeCompare(b.name, "id", { numeric: true })),
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
