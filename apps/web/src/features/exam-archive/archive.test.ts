import { expect, test } from "bun:test";
import { browseArchive, paperLinks, resolveArchive } from "./archive";
import { folderSearch, validateArchiveSearch } from "./search";
import type { ArchiveLocation, ExamCourse } from "./contracts";

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

test("course search ignores years and filenames and preserves empty courses", () => {
  expect(browseArchive({ catalog, location: [] }).entries.map((entry) => entry.name)).toEqual([
    "Agama Hindu",
    "Basis Data",
  ]);
  expect(
    browseArchive({ catalog, location: [], query: "  BASIS  " }).entries.map((entry) => entry.id),
  ).toEqual(["basis-data"]);
  expect(browseArchive({ catalog, location: [], query: "UTS" }).entries).toEqual([]);
  expect(browseArchive({ catalog, location: [], query: "2024" }).entries).toEqual([]);
  expect(browseArchive({ catalog, location: ["agama"] }).entries).toEqual([]);
});

test("folder navigation sorts years newest first and resolves papers without filtering filenames", () => {
  expect(
    browseArchive({ catalog, location: ["basis-data"] }).entries.map((entry) => entry.name),
  ).toEqual(["2024", "2023", "Tanpa tahun"]);
  expect(catalog[0].years.map((year) => year.name)).toEqual(["2023", "2024", "Tanpa tahun"]);
  expect(browseArchive({ catalog, location: ["basis-data", "2023"] }).entries).toEqual([]);
  const folder = browseArchive({ catalog, location: ["basis-data", "2024"], query: "no match" });
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
    const folder = browseArchive({ catalog, location });
    expect(folder.breadcrumbs.at(-2)?.location).toEqual(parent);
    if (parent) {
      expect(resolveArchive(folderSearch(parent), catalog).location).toEqual(parent);
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
  const resolved = resolveArchive(search, catalog);
  expect(resolved.location).toEqual(["basis-data", "2024"]);
  expect(resolved.paper?.id).toBe("pdf-id");
  expect(folderSearch(resolved.location)).toEqual({ course: "basis-data", year: "2024" });
  expect(resolveArchive({ ...search, course: "agama" }, catalog)).toEqual({
    location: ["agama"],
    paper: null,
  });
  expect(resolveArchive({ ...search, year: "2023" }, catalog).paper).toBeNull();
  expect(resolveArchive({ ...search, course: "missing" }, catalog)).toEqual({
    location: [],
    paper: null,
  });
  expect(resolveArchive({ ...search, file: "missing" }, catalog)).toEqual({
    location: ["basis-data", "2024"],
    paper: null,
  });
});
