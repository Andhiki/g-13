import { expect, test } from "bun:test";
import syllabi from "./syllabi.json";

test("2026 machine learning retains both source versions with separate provenance", () => {
  const record = syllabi["2026"].PACS262413;
  expect(record.title).toBe("Pembelajaran Mesin (3 SKS)");
  expect(record.pdfPage).toBe(217);
  expect(record.printedPage).toBe(199);
  expect(record.syllabus).toContain("Linear regression");
  expect(record.alternatives).toHaveLength(1);
  expect(record.alternatives[0].pdfPage).toBe(229);
  expect(record.alternatives[0].printedPage).toBe(211);
  expect(record.alternatives[0].syllabus).toContain("Reinforcement Learning");
  expect(record.alternatives[0].references).toHaveLength(1);
});

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
