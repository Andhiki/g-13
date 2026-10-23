import { describe, expect, test } from "bun:test";
import source from "../../output/data/ugm-ilkom-2021.json";
import { adaptCurriculum2021 } from "./2021";

const curriculum = adaptCurriculum2021(source);

describe("2021 Revisi 2023 source adapter", () => {
  test("preserves course identity, prerequisite text, and source references", () => {
    const course = curriculum.all.find((item) => item.id === "MII21-1203");
    expect(course).toMatchObject({
      code: "MII21-1203",
      title: "Algoritma dan Struktur Data",
      englishTitle: "Algorithms and Data Structures",
      placements: [
        {
          section: "core",
          label: "Wajib terjadwal (W)",
          semester: 2,
          credits: 3,
          prerequisiteRaw: "Pemrograman (1)",
          printedPage: 256,
          pdfPage: 271,
        },
      ],
    });
  });

  test("keeps repeated elective semesters as placements on one course", () => {
    const course = curriculum.all.find((item) => item.id === "MII21-2606");
    expect(course?.placements.map((placement) => placement.semester)).toEqual([3, 5, 7]);
    expect(course?.placements.map((placement) => placement.group)).toEqual([
      "Lab Sistem Komputer dan Jaringan",
      "Lab Sistem Komputer dan Jaringan",
      "Lab Sistem Komputer dan Jaringan",
    ]);
  });

  test("retains distinct credit placements for an elective slot", () => {
    const slot = curriculum.all.find((item) => item.id === "2021-slot-9-s4");
    expect(slot?.placements.map((placement) => placement.credits)).toEqual([3, 2]);
    expect(slot?.placements.every((placement) => placement.section === "core")).toBe(true);
  });

  test("keeps version totals and group counts in the shared curriculum data", () => {
    expect(curriculum).toMatchObject({
      id: "2021",
      edition: "Revisi 2023",
      requiredCredits: 104,
      totalCredits: 144,
      groups: expect.arrayContaining([
        { name: "Kegiatan MBKM", count: 46 },
        { name: "Lab Sistem Komputer dan Jaringan", count: 11 },
      ]),
    });
  });
});
