import type { ArchiveLocation } from "./contracts";

export type ArchiveSearch = { course?: string; year?: string; file?: string };

export function validateArchiveSearch(input: Record<string, unknown>): ArchiveSearch {
  const course =
    typeof input.course === "string" && input.course.length > 0 && input.course.length <= 300
      ? input.course
      : undefined;
  const rawYear = typeof input.year === "number" ? String(input.year) : input.year;
  const year =
    course && typeof rawYear === "string" && rawYear.length > 0 && rawYear.length <= 100
      ? rawYear
      : undefined;
  const file =
    year && typeof input.file === "string" && /^[\w-]{1,200}$/.test(input.file)
      ? input.file
      : undefined;
  return { course, year, file };
}

export function folderSearch(location: ArchiveLocation): ArchiveSearch {
  return { course: location[0], year: location[1] };
}
