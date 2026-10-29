import { expect, test } from "bun:test";
import { getSyllabus } from "@g13/curriculum";
import syllabi from "./syllabi.json";
import audit from "../../../../../output/data/ugm-ilkom-2026-syllabus-audit.json";

test("all 89 numbered 2026 source entries are represented, including the duplicate code", () => {
  const section = audit.numbered_ilkom_section;
  expect(section.entry_count).toBe(89);
  expect(section.unique_codes).toBe(88);
  expect(section.missing_ordinals).toEqual([]);
  expect(section.unextracted_entries).toEqual([]);
  expect(section.entries.map((entry) => entry.ordinal)).toEqual(
    Array.from({ length: 89 }, (_, i) => i + 1),
  );
  for (const entry of section.entries) {
    const record = syllabi[entry.code as keyof typeof syllabi];
    const versions = [record, ...("alternatives" in record ? record.alternatives : [])];
    expect(versions.some((version) => version.pdfPage === entry.pdf_page)).toBe(true);
  }
  expect(section.duplicate_codes).toEqual([
    { code: "PACS262413", ordinals: [21, 58], pdf_pages: [217, 229] },
  ]);
});

test("shared syllabi and alternate source headings retain their source pages", () => {
  expect(syllabi.PAKF262101.pdfPage).toBe(39);
  expect(syllabi.UNKU260012.pdfPage).toBe(42);
  expect(syllabi.PAKF262103.pdfPage).toBe(44);
  expect(syllabi.PAKF262105.pdfPage).toBe(44);
  expect(syllabi.PACS262519.pdfPage).toBe(233);
  expect(syllabi.UNKU260003.references.length).toBeGreaterThan(0);
  expect(syllabi.UNKU260003.syllabus).not.toContain("Referensi");
});

test("source completeness is distinct from table-code coverage", () => {
  expect(audit.coverage.syllabus_codes).toBe(106);
  expect(audit.coverage.table_course_codes).toBe(108);
  expect(audit.coverage.table_codes_with_syllabi).toBe(97);
  expect(audit.coverage.table_codes_without_syllabi).toHaveLength(11);
  const retrieval = audit.coverage.table_codes_without_syllabi.find(
    (row) => row.code === "PACS262422",
  )!;
  expect(retrieval.status).toBe("source_code_conflict");
  expect(retrieval.source_candidates.map((row) => row.code)).toEqual(["PACS262008"]);
});

test("2026 machine learning retains both source versions with separate provenance", () => {
  const record = syllabi.PACS262413;
  expect(getSyllabus("2026", "PACS262413")?.alternatives?.[0].pdfPage).toBe(229);
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
  expect(syllabi.PACS262201.syllabus).toContain("Disjoint Set and Union Find");
  expect(syllabi.PACS262201.pdfPage).toBe(212);
  expect(syllabi.PACS262201.references).toHaveLength(3);
  expect(syllabi.PACS262201.references[0]).toStartWith("Dasgupta");
  expect(syllabi.PACS262201.references[2]).toContain("Cormen");
  for (const record of Object.values(syllabi)) {
    expect(record.syllabus.length).toBeGreaterThan(0);
    expect(record.pdfPage - record.printedPage).toBe(18);
    expect(record.syllabus).not.toMatch(/Halaman\s*\||DEPARTEMEN ILMU KOMPUTER|\bFAKULTAS\b/);
  }
});
