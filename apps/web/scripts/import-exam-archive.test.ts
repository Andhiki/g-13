import { expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import {
  normalizeArchive,
  parseCourses,
  parseFolder,
  readCatalog,
  renderCatalog,
} from "./import-exam-archive";
import { examCourses } from "@/routes/_public/exam/-shared/catalog";
import type { ExamCourse } from "@/routes/_public/exam/-shared/contracts";

const pdf = (id: string, name: string) => ({
  id,
  name,
  mimeType: "application/pdf",
  createdAt: null,
});
const folder = (id: string, name: string) => ({
  id,
  name,
  mimeType: "application/vnd.google-apps.folder",
  createdAt: null,
});
const courses = [{ name: "Basis Data", folderId: "root" }];

test("source links preserve names and aliases but deduplicate identical course links", async () => {
  const result =
    await parseCourses(`<a href="https://drive.google.com/open?id=root"><span>Basis Data</span></a>
    <a href="https://drive.google.com/open?id=root">Basis Data</a>
    <a href="https://drive.google.com/drive/folders/root">A &amp; B</a>`);
  expect(result).toEqual([...courses, { name: "A & B", folderId: "root" }]);
  expect(parseCourses("<p>Unavailable</p>")).rejects.toThrow("No courses");
});

test("Drive parsing distinguishes empty from unreadable, malformed and paginated listings", () => {
  const html = (data: unknown) =>
    `window['_DRIVE_ivd'] = '${JSON.stringify(data).replaceAll("'", "\\'")}';`;
  expect(parseFolder(html([null, null, null, null]))).toEqual([]);
  expect(
    parseFolder(html([[["pdf", [], "It's an exam.pdf", "application/pdf"]], null, null, null])),
  ).toEqual([pdf("pdf", "It's an exam.pdf")]);
  const dated = [
    "pdf",
    [],
    "Dated.pdf",
    "application/pdf",
    0,
    null,
    0,
    0,
    0,
    0,
    Date.UTC(2024, 8, 3),
  ];
  expect(parseFolder(html([[dated], null, null, null]))[0]?.createdAt).toBe(
    "2024-09-03T00:00:00.000Z",
  );
  expect(() => parseFolder("Sign in")).toThrow("listing missing");
  expect(() => parseFolder(html([[null], null, null, null]))).toThrow("Invalid Drive entry");
  expect(() => parseFolder(html([[], "next-page", null, null]))).toThrow("paginated");
});

test("normalization handles years, non-PDFs, duplicates, empty years, and unknown or conflicting metadata", () => {
  const result = normalizeArchive({
    courses,
    folders: new Map([
      [
        "root",
        {
          files: [
            folder("uts", "UTS"),
            { ...folder("year", "2023–2024"), createdAt: "2023-05-01T00:00:00.000Z" },
            folder("empty", "2022"),
          ],
        },
      ],
      [
        "uts",
        {
          files: [
            pdf("one", "UTS - 2024.pdf"),
            pdf("one", "UTS - 2024.pdf"),
            {
              id: "image",
              name: "UAS_Deep Learning2.jpg",
              mimeType: "image/jpeg",
              createdAt: null,
            },
            pdf("ambiguous", "UAS - 2018 copy 2019.pdf"),
          ],
        },
      ],
      ["year", { files: [pdf("two", "UTS 2022.pdf")] }],
      ["empty", { files: [] }],
    ]),
  });
  expect(result.writable).toBe(true);
  const years = result.catalog[0].years;
  expect(years.find((year) => year.name === "2024")?.papers).toHaveLength(1);
  expect(years.find((year) => year.name === "2023–2024")?.createdAt).toBe(
    "2023-05-01T00:00:00.000Z",
  );
  expect(years.find((year) => year.name === "2022")?.papers).toEqual([]);
  expect(years.find((year) => year.name === "2023–2024")?.papers[0].id).toBe("two");
  expect(years.find((year) => year.name === "Tanpa tahun")?.papers).toHaveLength(2);
  expect(
    years.find((year) => year.name === "Tanpa tahun")?.papers.find((paper) => paper.id === "image")
      ?.exam,
  ).toBe("UAS");
  expect(result.diagnostics.some((entry) => entry.message.includes("Review year"))).toBe(true);
  expect(result.diagnostics.some((entry) => entry.message.includes("Review exam"))).toBe(true);
  expect(result.diagnostics.some((entry) => entry.message.includes("Duplicate paper"))).toBe(true);
});

test("failed descendants preserve the whole previous course and new unreadable courses prevent writing", () => {
  const previous: ExamCourse[] = [
    {
      id: "stable-id",
      name: "Basis Data",
      sourceFolderId: "root",
      createdAt: null,
      years: [
        {
          name: "2024",
          createdAt: null,
          papers: [{ ...pdf("old", "Old.pdf"), exam: null, sourceFolderId: "child" }],
        },
      ],
    },
  ];
  const folders = new Map([
    ["root", { files: [folder("child", "UTS")] }],
    ["child", { error: "HTTP 403" }],
  ]);
  const result = normalizeArchive({ courses, folders, previous });
  expect(result.writable).toBe(true);
  expect(result.catalog).toEqual(previous);
  expect(normalizeArchive({ courses, folders }).writable).toBe(false);
  expect(
    normalizeArchive({ courses, folders: new Map([["root", { files: [] }]]) }).catalog[0].years,
  ).toEqual([]);
});

test("shared source folders keep distinct course identities without cycles", () => {
  const result = normalizeArchive({
    courses: [...courses, { name: "Alias", folderId: "root" }],
    folders: new Map([["root", { files: [folder("root", "cycle"), pdf("one", "UTS 2024.pdf")] }]]),
  });
  expect(new Set(result.catalog.map((course) => course.id)).size).toBe(2);
  expect(result.catalog.map((course) => course.years[0].papers.length)).toEqual([1, 1]);
});

test("the course index omits paper metadata and each course gets its own module", () => {
  const paper = {
    id: "p",
    name: "UTS.pdf",
    exam: "UTS" as const,
    mimeType: "application/pdf",
    createdAt: null,
    sourceFolderId: "paper-folder",
  };
  const files = renderCatalog([
    {
      id: "a",
      name: "Basis Data",
      sourceFolderId: "src-a",
      createdAt: null,
      years: [{ name: "2024", createdAt: null, papers: [paper] }],
    },
    { id: "b", name: "Basis-Data", sourceFolderId: "src-b", createdAt: null, years: [] },
  ]);
  expect([...files.keys()]).toEqual([
    "courses/basis-data.ts",
    "courses/basis-data-2.ts",
    "index.ts",
  ]);
  const index = files.get("index.ts") ?? "";
  expect(index).toContain('load: () => import("./courses/basis-data-2")');
  expect(index).not.toContain("sourceFolderId");
  expect(index).not.toContain("UTS.pdf");
  expect(files.get("courses/basis-data.ts")).toContain('"paper-folder"');
});

test("the live catalog index references every course module exactly once", async () => {
  const dir = new URL("../src/routes/_public/exam/-shared/catalog/", import.meta.url);
  const modules = (await readdir(new URL("courses/", dir))).map((file) =>
    file.replace(/\.ts$/, ""),
  );
  const index = await Bun.file(new URL("index.ts", dir)).text();
  const referenced = [...index.matchAll(/import\("\.\/courses\/([^"]+)"\)/g)].map((m) => m[1]);
  expect(referenced.sort()).toEqual(modules.sort());
  expect(new Set(examCourses.map((course) => course.id)).size).toBe(examCourses.length);
  const catalog = await readCatalog();
  expect(catalog.map((course) => course.id)).toEqual(examCourses.map((course) => course.id));
});
