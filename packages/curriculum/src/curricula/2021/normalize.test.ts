import { describe, expect, test } from "bun:test";
import source from "./source.json";
import { adaptCurriculum2021 } from "./normalize";

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
    expect(slot?.title).toBe("Mata Kuliah Pilihan");
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
        { name: "Kegiatan MBKM", count: 46, kind: "other" },
        { name: "Lab Sistem Komputer dan Jaringan", count: 11, kind: "interest" },
      ]),
    });
  });
});

test("course display names omit embedded PDF font symbols while preserving source text", () => {
  for (const course of curriculum.all) {
    expect(course.title).not.toMatch(/\p{Co}/u);
    expect(course.englishTitle).not.toMatch(/\p{Co}/u);
    expect(course.title).toBe(course.title.trim());
    expect(course.englishTitle).toBe(course.englishTitle.trim());
  }
  expect(curriculum.all.find((course) => course.id === "MII21-3002")?.title).toBe(
    "Metodologi Penelitian Ilmu Komputer",
  );
  expect(curriculum.all.find((course) => course.id === "MII21-4002")?.title).toBe("Skripsi");
  expect(
    source.required_schedule.courses.find((row) => row.code_raw === "MII21-4002")?.name_id,
  ).toContain("\uf0b5");
});

test("elective slots share a simple display name while retaining distinct identities and source names", () => {
  const slots = curriculum.all.filter((course) => course.id.startsWith("2021-slot-"));
  expect(slots.length).toBeGreaterThan(1);
  expect(new Set(slots.map((course) => course.title))).toEqual(new Set(["Mata Kuliah Pilihan"]));
  expect(new Set(slots.map((course) => course.id)).size).toBe(slots.length);
  expect(
    source.required_schedule.courses.find((row) => row.record_kind === "elective_slot")?.name_id,
  ).toBe("Mata Kuliah Pilihan-1");
});

test("combines religion alternatives into one two-credit semester-one course", () => {
  const religions = curriculum.core.filter((course) =>
    course.placements.some((p) => p.label === "Pilihan agama"),
  );
  expect(religions).toHaveLength(1);
  expect(religions[0]).toMatchObject({
    id: "2021-agama",
    code: "",
    title: "Agama",
    englishTitle: "Religion",
    placements: [{ semester: 1, credits: 2 }],
  });
  expect(
    source.required_schedule.courses.filter((row) => row.choice_group === "religion"),
  ).toHaveLength(6);
});
