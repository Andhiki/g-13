import { expect, test } from "bun:test";
import syllabi from "./syllabi.json";

test("syllabi retain edition-specific source text and page provenance", () => {
  expect(syllabi["2026"].PACS262201.syllabus).toContain("Disjoint Set and Union Find");
  expect(syllabi["2026"].PACS262201.pdfPage).toBe(212);
  expect(syllabi["2026"].PACS262201.references).toHaveLength(3);
  expect(syllabi["2026"].PACS262201.references[0]).toStartWith("Dasgupta");
  expect(syllabi["2026"].PACS262201.references[2]).toContain("Cormen");
  expect(syllabi["2021"].MII211001.references).toHaveLength(6);
  expect(syllabi["2021"].MII211001.syllabus).toContain("Eliminasi Gauss-Jordan");
  for (const [year, records] of Object.entries(syllabi)) {
    for (const record of Object.values(records)) {
      expect(record.syllabus.length).toBeGreaterThan(0);
      expect(record.pdfPage - record.printedPage).toBe(year === "2021" ? 15 : 18);
      expect(record.syllabus).not.toMatch(/Halaman\s*\||DEPARTEMEN ILMU KOMPUTER/);
    }
  }
});
