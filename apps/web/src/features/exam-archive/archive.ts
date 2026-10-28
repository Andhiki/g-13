import { archiveSource, examArchive } from "./catalog";
import type { ArchiveLocation, ExamCourse, ExamPaper } from "./contracts";
import type { ArchiveSearch } from "./search";

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
      .filter((entry) => entry.name.toLocaleLowerCase("id").includes(search))
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
