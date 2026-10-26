import { expect, test } from "bun:test";
import { syllabusPoints } from "./syllabus-format";

test("formats topic delimiters while retaining prose and decimal numbers", () => {
  expect(syllabusPoints("Tree; Graf; Pencarian.")).toEqual(["Tree", "Graf", "Pencarian."]);
  expect(syllabusPoints("1. Tree 2. Graf 3. Pencarian.")).toEqual(["Tree", "Graf", "Pencarian."]);
  expect(syllabusPoints("Mahasiswa mengikuti magang. Laporan dipresentasikan.")).toEqual([
    "Mahasiswa mengikuti magang. Laporan dipresentasikan.",
  ]);
  expect(syllabusPoints("Versi 3.14; Implementasi.")).toEqual(["Versi 3.14", "Implementasi."]);
});
