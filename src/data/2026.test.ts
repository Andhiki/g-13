import { describe, expect, test } from "bun:test";
import source from "../../output/data/ugm-ilkom-2026.json";
import { adaptCurriculum2026 } from "./2026";

const curriculum = adaptCurriculum2026(source);

describe("2026 curriculum source adapter", () => {
  test("preserves required course details and source pages", () => {
    const course = curriculum.all.find((item) => item.id === "PACS262101");
    expect(course).toMatchObject({
      title: "Aljabar Vektor dan Matriks",
      placements: [
        {
          section: "core",
          label: "Wajib",
          semester: 1,
          credits: 2,
          prerequisiteRaw: "-",
          printedPage: 168,
          pdfPage: 186,
        },
      ],
    });
  });

  test("keeps Wajib Minat attached to its interest area", () => {
    const course = curriculum.all.find((item) => item.id === "PACS262303");
    expect(course?.placements[0]).toMatchObject({
      section: "interest",
      label: "Wajib minat (WM)",
      group: "Komputasi Cerdas",
      prerequisiteRaw: "Pemrograman, Aljabar Vektor dan Matriks",
    });
  });

  test("keeps P courses as free electives", () => {
    const course = curriculum.all.find((item) => item.id === "PACS262307");
    expect(course?.placements[0]).toMatchObject({
      section: "elective",
      label: "Pilihan bebas (P)",
      group: "Pilihan bebas",
    });
  });

  test("preserves repeated source placements on one course", () => {
    const course = curriculum.all.find((item) => item.id === "PACS262530");
    expect(course?.placements).toHaveLength(4);
    expect(course?.placements.map((placement) => placement.semester)).toEqual([6, 6, 6, 5]);
  });

  test("keeps curriculum totals and reading notes", () => {
    expect(curriculum).toMatchObject({
      id: "2026",
      requiredCredits: 109,
      totalCredits: 144,
      readingNotes: expect.arrayContaining([
        expect.stringContaining("WM wajib bagi mahasiswa yang memilih minat"),
      ]),
    });
  });
});

test("exposes internship activity courses with source provenance and both permitted semesters", () => {
  const course = curriculum.all.find((x) => x.id === "PACS262609");
  expect(course?.placements.map((x) => x.semester)).toEqual([6, 7]);
  expect(course?.placements[0]).toMatchObject({
    section: "elective",
    credits: 16,
    printedPage: 174,
    pdfPage: 192,
  });
});
