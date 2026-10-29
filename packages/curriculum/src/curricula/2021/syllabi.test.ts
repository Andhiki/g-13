import { expect, test } from "bun:test";
import { getSyllabus } from "@g13/curriculum";
import syllabi from "./syllabi.json";

test("2021 syllabi retain source text, page provenance, and unresolved code collisions", () => {
  expect(syllabi.MFF1011.syllabus.length).toBeGreaterThan(0);
  expect(syllabi.MII211202.pdfPage).toBe(321);
  expect(getSyllabus("2021", "MII21-1202")?.pdfPage).toBe(321);
  expect(syllabi.MII211001.references).toHaveLength(6);
  expect(syllabi.MII211001.syllabus).toContain("Eliminasi Gauss-Jordan");
  expect("MII213603" in syllabi).toBe(false);
  for (const record of Object.values(syllabi)) {
    expect(record.syllabus.length).toBeGreaterThan(0);
    expect(record.pdfPage - record.printedPage).toBe(15);
    expect(record.syllabus).not.toMatch(/Halaman\s*\||DEPARTEMEN ILMU KOMPUTER|\bFAKULTAS\b/);
  }
});
