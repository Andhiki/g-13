import { expect, test } from "bun:test";
import { browseArchive, loadExamCourse, paperLinks, resolveArchive } from "./archive";
import { folderSearch, validateArchiveSearch } from "./search";
import type { ArchiveSearch } from "./search";
import type { ArchiveLocation, ExamCourse, ExamCourseEntry } from "./contracts";

const catalog = [
  {
    id: "basis-data",
    name: "Basis Data",
    sourceFolderId: "basis-data",
    createdAt: null,
    years: [
      { name: "2023", createdAt: null, papers: [] },
      {
        name: "2024",
        createdAt: null,
        papers: [
          {
            id: "pdf-id",
            name: "UTS Basis Data.pdf",
            exam: "UTS",
            mimeType: "application/pdf",
            createdAt: null,
            sourceFolderId: "uts-source",
          },
        ],
      },
      { name: "Tanpa tahun", createdAt: null, papers: [] },
    ],
  },
  { id: "agama", name: "Agama Hindu", sourceFolderId: "agama", createdAt: null, years: [] },
] satisfies ExamCourse[];

const opened = (id: string | undefined) => catalog.find((course) => course.id === id) ?? null;
const open = (location: ArchiveLocation) => ({ catalog, location, course: opened(location[0]) });
const resolve = (search: ArchiveSearch) => resolveArchive(search, opened(search.course));

test("course search ignores years and filenames and preserves empty courses", () => {
  expect(browseArchive(open([])).entries.map((entry) => entry.name)).toEqual([
    "Agama Hindu",
    "Basis Data",
  ]);
  expect(
    browseArchive({ ...open([]), query: "  BASIS  " }).entries.map((entry) => entry.id),
  ).toEqual(["basis-data"]);
  expect(browseArchive({ ...open([]), query: "UTS" }).entries).toEqual([]);
  expect(browseArchive({ ...open([]), query: "2024" }).entries).toEqual([]);
  expect(browseArchive(open(["agama"])).entries).toEqual([]);
});

test("course search handles punctuation, word order, and typos", () => {
  for (const query of ["basis-data", "data basis", "bais data", "basiss data", "baiss data"]) {
    expect(browseArchive({ ...open([]), query }).entries.map((entry) => entry.id)).toEqual([
      "basis-data",
    ]);
  }
  expect(browseArchive({ ...open([]), query: "---" }).entries).toEqual([]);
});

test("course search ranks close matches and supports aliases and incomplete typos", () => {
  const courses = [
    ...catalog,
    {
      id: "other",
      name: "Pengantar Basis Data",
      sourceFolderId: "other",
      createdAt: null,
      years: [],
    },
    {
      id: "algorithm",
      name: "Algoritma Genetika",
      sourceFolderId: "algorithm",
      createdAt: null,
      years: [],
    },
    {
      id: "ambiguous",
      name: "Data Dasar",
      sourceFolderId: "ambiguous",
      createdAt: null,
      years: [],
    },
  ];
  const results = (query: string) =>
    browseArchive({ catalog: courses, location: [], query }).entries.map((entry) => entry.id);
  expect(results("basis data")).toEqual(["basis-data", "other"]);
  expect(results("basdat")).toEqual(["basis-data"]);
  expect(results("algorim")).toEqual(["algorithm"]);
  expect(results("da data")).toEqual(["ambiguous"]);
  expect(results("xx")).toEqual([]);
});

test("folder navigation sorts years newest first and resolves papers without filtering filenames", () => {
  expect(browseArchive(open(["basis-data"])).entries.map((entry) => entry.name)).toEqual([
    "2024",
    "2023",
    "Tanpa tahun",
  ]);
  expect(catalog[0].years.map((year) => year.name)).toEqual(["2023", "2024", "Tanpa tahun"]);
  expect(browseArchive(open(["basis-data", "2023"])).entries).toEqual([]);
  const folder = browseArchive({ ...open(["basis-data", "2024"]), query: "no match" });
  expect(folder.breadcrumbs).toEqual([
    { name: "Arsip Ujian", location: [] },
    { name: "Basis Data", location: ["basis-data"] },
    { name: "2024", location: ["basis-data", "2024"] },
  ]);
  const paper = folder.entries[0];
  expect(paper?.kind).toBe("paper");
  if (paper?.kind !== "paper") throw new Error("Expected paper");
  expect(paperLinks(paper.paper)).toEqual({
    preview: "https://drive.google.com/file/d/pdf-id/preview",
    drive: "https://drive.google.com/file/d/pdf-id/view",
    download: "https://drive.google.com/uc?export=download&id=pdf-id",
  });
});

test("parent navigation goes up one folder, including empty folders, and stops at root", () => {
  const cases: { location: ArchiveLocation; parent: ArchiveLocation | undefined }[] = [
    { location: [], parent: undefined },
    { location: ["basis-data"], parent: [] },
    { location: ["basis-data", "2024"], parent: ["basis-data"] },
    { location: ["basis-data", "2023"], parent: ["basis-data"] },
    { location: ["agama"], parent: [] },
  ];
  for (const { location, parent } of cases) {
    const folder = browseArchive(open(location));
    expect(folder.breadcrumbs.at(-2)?.location).toEqual(parent);
    if (parent) {
      expect(resolve(folderSearch(parent)).location).toEqual(parent);
    }
  }
});

test("URL validation drops malformed input and resolves papers only inside the requested folder", () => {
  expect(validateArchiveSearch({ course: {}, year: [2024], file: { id: "pdf-id" } })).toEqual({
    course: undefined,
    year: undefined,
    file: undefined,
  });
  expect(
    validateArchiveSearch({ course: "basis-data", year: 2024, file: "https://example.com" }),
  ).toEqual({ course: "basis-data", year: "2024", file: undefined });
  const search = validateArchiveSearch({ course: "basis-data", year: 2024, file: "pdf-id" });
  const resolved = resolve(search);
  expect(resolved.location).toEqual(["basis-data", "2024"]);
  expect(resolved.paper?.id).toBe("pdf-id");
  expect(folderSearch(resolved.location)).toEqual({ course: "basis-data", year: "2024" });
  expect(resolve({ ...search, course: "agama" })).toEqual({
    location: ["agama"],
    paper: null,
  });
  expect(resolve({ ...search, year: "2023" }).paper).toBeNull();
  expect(resolve({ ...search, course: "missing" })).toEqual({
    location: [],
    paper: null,
  });
  expect(resolve({ ...search, file: "missing" })).toEqual({
    location: ["basis-data", "2024"],
    paper: null,
  });
});

test("a course's paper metadata loads on demand and an unopened course stays a summary", async () => {
  let loads = 0;
  const entries: ExamCourseEntry[] = catalog.map(({ sourceFolderId, years, ...summary }) => ({
    ...summary,
    load: async () => {
      loads++;
      return { default: { sourceFolderId, years } };
    },
  }));
  expect(browseArchive({ catalog: entries, location: [] }).entries).toHaveLength(2);
  expect(loads).toBe(0);
  expect(await loadExamCourse("basis-data", entries)).toEqual(catalog[0]);
  expect(await loadExamCourse("missing", entries)).toBeNull();
  expect(await loadExamCourse(undefined, entries)).toBeNull();
  expect(loads).toBe(1);
  // A course folder whose metadata has not loaded falls back to the root.
  expect(browseArchive({ catalog, location: ["basis-data"] }).breadcrumbs).toHaveLength(1);
  expect(resolveArchive({ course: "basis-data", year: "2024" }, null).location).toEqual([]);
});
