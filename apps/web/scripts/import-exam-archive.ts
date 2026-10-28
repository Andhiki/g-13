import { rename } from "node:fs/promises";
import { resolve } from "node:path";
import { examArchive, archiveSource } from "../src/features/exam-archive/catalog";
import type { ExamCourse, ExamPaper } from "../src/features/exam-archive/contracts";

type SourceCourse = { name: string; folderId: string };
type SourceFile = { id: string; name: string; mimeType: string; createdAt: string | null };
type Folder = { files: SourceFile[] } | { error: string };
type Diagnostic = { source: string; message: string };
const folderMime = "application/vnd.google-apps.folder";

export async function parseCourses(html: string): Promise<SourceCourse[]> {
  const courses: SourceCourse[] = [];
  let current: SourceCourse | null = null;
  await new HTMLRewriter()
    .on("a[href]", {
      element(element) {
        current = null;
        const url = new URL(element.getAttribute("href") ?? "", archiveSource);
        if (url.hostname !== "drive.google.com") return;
        const folderId =
          url.searchParams.get("id") ?? url.pathname.match(/\/folders\/([\w-]+)/)?.[1];
        if (!folderId || !/^[\w-]+$/.test(folderId)) throw new Error("Invalid source folder ID");
        current = { folderId, name: "" };
        courses.push(current);
        element.onEndTag(() => {
          current = null;
        });
      },
      text(text) {
        if (current) current.name += text.text;
      },
    })
    .transform(new Response(html))
    .text();
  const unique = new Map<string, SourceCourse>();
  for (const course of courses) {
    const entities: Record<string, string> = {
      amp: "&",
      lt: "<",
      gt: ">",
      quot: '"',
      apos: "'",
      nbsp: " ",
    };
    course.name = course.name
      .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, entity: string) =>
        entity.startsWith("#")
          ? String.fromCodePoint(
              parseInt(
                entity.slice(entity[1].toLowerCase() === "x" ? 2 : 1),
                entity[1].toLowerCase() === "x" ? 16 : 10,
              ),
            )
          : entities[entity.toLowerCase()],
      )
      .replace(/\s+/g, " ")
      .trim();
    if (!course.name) throw new Error("A source course has no name");
    unique.set(`${course.folderId}:${course.name}`, course);
  }
  if (!unique.size) throw new Error("No courses found; refusing to replace the catalog");
  return [...unique.values()];
}

export function parseFolder(html: string): SourceFile[] {
  const encoded = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'((?:\\.|[^'\\])*)';/)?.[1];
  if (!encoded) throw new Error("Drive listing missing (restricted folder or changed page format)");
  const decoded = encoded
    .replace(/\\x([0-9a-f]{2})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\'/g, "'");
  const data: unknown = JSON.parse(decoded);
  if (
    !Array.isArray(data) ||
    data.length < 4 ||
    ![undefined, null].includes(data[1]) ||
    data[2] != null ||
    data[3] != null
  ) {
    throw new Error("Incomplete or paginated Drive listing; manual review required");
  }
  if (data[0] === null) return [];
  if (!Array.isArray(data[0])) throw new Error("Invalid Drive file list");
  return data[0].map((row: unknown) => {
    if (
      !Array.isArray(row) ||
      typeof row[0] !== "string" ||
      !/^[\w-]+$/.test(row[0]) ||
      typeof row[2] !== "string" ||
      !row[2].trim() ||
      typeof row[3] !== "string" ||
      !row[3].includes("/")
    ) {
      throw new Error("Invalid Drive entry; refusing a partial listing");
    }
    // Drive serializes createdTime as epoch milliseconds in listing field 10.
    const timestamp = typeof row[10] === "number" ? row[10] : Number(row[10]);
    const createdAt =
      Number.isFinite(timestamp) && timestamp > 0 && timestamp <= 8.64e15
        ? new Date(timestamp).toISOString()
        : null;
    return { id: row[0], name: row[2], mimeType: row[3], createdAt };
  });
}

function yearsIn(name: string) {
  return [...name.matchAll(/(?<!\d)(?:19|20)\d{2}(?:\s*[-–/]\s*(?:19|20)\d{2})?(?!\d)/g)].map(
    (match) => match[0],
  );
}

export function normalizeArchive({
  courses,
  folders,
  previous = [],
}: {
  courses: SourceCourse[];
  folders: ReadonlyMap<string, Folder>;
  previous?: readonly ExamCourse[];
}) {
  const diagnostics: Diagnostic[] = [];
  const catalog: ExamCourse[] = [];
  let writable = true;
  for (const source of courses) {
    const years = new Map<string, { createdAt: string | null; papers: Map<string, ExamPaper> }>();
    let failed = false;
    function visit(id: string, ancestors: string[], visited: Set<string>) {
      if (visited.has(id)) {
        diagnostics.push({ source: id, message: "Repeated/cyclic folder link ignored" });
        return;
      }
      visited.add(id);
      const folder = folders.get(id);
      if (!folder || "error" in folder) {
        failed = true;
        diagnostics.push({
          source: id,
          message: folder && "error" in folder ? folder.error : "Folder was not fetched",
        });
        return;
      }
      const folderYears = ancestors.flatMap(yearsIn);
      const folderYear = folderYears.at(-1);
      if (!folder.files.length && ancestors.length) {
        const emptyYear = folderYear ?? "Tanpa tahun";
        years.set(emptyYear, years.get(emptyYear) ?? { createdAt: null, papers: new Map() });
      }
      for (const file of folder.files) {
        if (file.mimeType === folderMime) {
          const yearFolder = yearsIn(file.name).at(-1);
          if (yearFolder) {
            const year = years.get(yearFolder) ?? { createdAt: file.createdAt, papers: new Map() };
            year.createdAt ??= file.createdAt;
            years.set(yearFolder, year);
          }
          visit(file.id, [...ancestors, file.name], visited);
          continue;
        }
        const filenameYears = [...new Set(yearsIn(file.name))];
        const year = folderYear ?? (filenameYears.length === 1 ? filenameYears[0] : "Tanpa tahun");
        const fileExams = file.name.toUpperCase().match(/(?<![A-Z])(?:UTS|UAS)(?![A-Z])/g) ?? [];
        const folderExams =
          ancestors
            .join(" ")
            .toUpperCase()
            .match(/(?<![A-Z])(?:UTS|UAS)(?![A-Z])/g) ?? [];
        const examLabel = fileExams.length === 1 ? fileExams[0] : folderExams.at(-1);
        const exam = examLabel === "UTS" || examLabel === "UAS" ? examLabel : null;
        if (
          year === "Tanpa tahun" ||
          filenameYears.length > 1 ||
          (folderYear && filenameYears.some((value) => value !== folderYear))
        ) {
          diagnostics.push({ source: file.id, message: `Review year: ${file.name} → ${year}` });
        }
        if (
          !exam ||
          fileExams.length > 1 ||
          (fileExams.length === 1 && folderExams.some((value) => value !== exam))
        ) {
          diagnostics.push({
            source: file.id,
            message: `Review exam label: ${file.name} → ${exam ?? "unknown"}`,
          });
        }
        const yearContents = years.get(year) ?? { createdAt: null, papers: new Map() };
        if (yearContents.papers.has(file.id))
          diagnostics.push({
            source: file.id,
            message: "Duplicate paper in destination folder ignored",
          });
        yearContents.papers.set(file.id, { ...file, exam, sourceFolderId: id });
        years.set(year, yearContents);
      }
    }
    visit(source.folderId, [], new Set());
    const old = previous.find(
      (course) => course.sourceFolderId === source.folderId && course.name === source.name,
    );
    if (failed) {
      if (old) catalog.push(old);
      else writable = false;
      diagnostics.push({
        source: source.folderId,
        message: old
          ? `Preserved previous course: ${source.name}`
          : `No previous entries for ${source.name}; catalog will not be written`,
      });
      continue;
    }
    catalog.push({
      id: old?.id ?? `${source.folderId}:${source.name}`,
      name: source.name,
      sourceFolderId: source.folderId,
      createdAt: null,
      years: [...years].map(([name, year]) => ({
        name,
        createdAt: year.createdAt,
        papers: [...year.papers.values()].sort((a, b) =>
          a.name.localeCompare(b.name, "id", { numeric: true }),
        ),
      })),
    });
  }
  return { catalog, diagnostics, writable };
}

async function fetchHtml(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.text();
}

async function main() {
  const output = process.argv[2];
  if (!output)
    throw new Error(
      "Usage: bun scripts/import-exam-archive.ts <candidate.ts>; review before replacing the human-maintained catalog",
    );
  const target = resolve(output);
  const liveCatalog = resolve(import.meta.dir, "../src/features/exam-archive/catalog.ts");
  if (target === liveCatalog)
    throw new Error(
      "Write a candidate file; never overwrite the human-maintained catalog directly",
    );
  const courses = await parseCourses(await fetchHtml(archiveSource));
  const folders = new Map<string, Folder>();
  let queue = [...new Set(courses.map((course) => course.folderId))];
  const queued = new Set(queue);
  while (queue.length) {
    const batch = queue.splice(0, 4);
    await Promise.all(
      batch.map(async (id) => {
        try {
          const files = parseFolder(
            await fetchHtml(`https://drive.google.com/drive/folders/${id}`),
          );
          folders.set(id, { files });
          for (const file of files) {
            if (file.mimeType === folderMime && !queued.has(file.id)) {
              queued.add(file.id);
              queue.push(file.id);
            }
          }
        } catch (error) {
          folders.set(id, { error: error instanceof Error ? error.message : String(error) });
        }
      }),
    );
    if (folders.size % 20 === 0 || !queue.length)
      console.info(`Read ${folders.size} folders; ${queue.length} remaining`);
  }
  const result = normalizeArchive({ courses, folders, previous: examArchive });
  const report = {
    source: archiveSource,
    importedAt: new Date().toISOString(),
    courses: courses.length,
    folders: folders.size,
    files: result.catalog.reduce(
      (sum, course) => sum + course.years.reduce((count, year) => count + year.papers.length, 0),
      0,
    ),
    writable: result.writable,
    diagnostics: result.diagnostics,
  };
  await Bun.write(`${target}.report.json`, JSON.stringify(report, null, 2) + "\n");
  if (!result.writable)
    throw new Error(`Import incomplete; catalog untouched. See ${target}.report.json`);
  const source = `import type { ExamCourse } from "./contracts";\n\nexport const archiveSource = ${JSON.stringify(archiveSource)};\n\nexport const examArchive: ExamCourse[] = ${JSON.stringify(result.catalog, null, 2)} satisfies ExamCourse[];\n`;
  await Bun.write(`${target}.tmp`, source);
  await rename(`${target}.tmp`, target);
  console.info(
    `Wrote candidate: ${courses.length} courses, ${report.files} files. Review ${target}.report.json before adopting.`,
  );
}

if (import.meta.main) await main();
