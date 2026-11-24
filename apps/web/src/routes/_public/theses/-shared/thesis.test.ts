import { expect, test } from "bun:test";
import {
  abstractParagraphs,
  citationFor,
  composeThesesIndex,
  filterTheses,
  jsonLdFor,
  metaDescriptionFor,
  publicContact,
  safeHttpUrl,
  toThesisCard,
  toThesisDetail,
  type ThesisDetailRecord,
} from "./thesis";

const record: ThesisDetailRecord = {
  id: "contoh-skripsi-2026",
  title: "Contoh Skripsi",
  authorName: "Ayu Contoh",
  authorBatch: 2022,
  year: 2026,
  type: "skripsi",
  field: "Sistem Cerdas",
  keywords: ["machine learning", "evaluasi"],
  supervisors: [
    {
      name: "Dr. Snapshot, M.Kom.",
      lecturerId: "nur-rokhman",
      lecturerName: "Dr. Nur Rokhman",
      lecturerDeletedAt: null,
      role: "main",
    },
    {
      name: "Dr. Pembimbing Eksternal",
      lecturerId: null,
      lecturerName: null,
      lecturerDeletedAt: null,
      role: "co",
    },
  ],
  abstract: "Abstrak rahasia yang hanya boleh tampil dengan izin.",
  abstractEn: "Secret abstract that requires consent.",
  language: "id",
  repositoryUrl: "https://etd.repository.ugm.ac.id/home/detail_pencarian/000001",
  contactChannel: "email",
  contactValue: "ayu@example.com",
  abstractPublic: true,
  contactPublic: true,
};

test("card DTO never exposes abstract, contact, or consent internals", () => {
  const card = toThesisCard(record);
  expect(card).toMatchObject({
    slug: "contoh-skripsi-2026",
    title: "Contoh Skripsi",
    authorName: "Ayu Contoh",
    authorBatch: 2022,
    year: 2026,
    type: "skripsi",
    field: "Sistem Cerdas",
    keywords: ["machine learning", "evaluasi"],
  });
  expect(card.supervisors).toEqual([
    { name: "Dr. Nur Rokhman", lecturerId: "nur-rokhman", role: "main" },
    { name: "Dr. Pembimbing Eksternal", lecturerId: null, role: "co" },
  ]);
  expect(JSON.stringify(card)).not.toContain("Abstrak rahasia");
  expect(JSON.stringify(card)).not.toContain("ayu@example.com");
});

test("detail DTO withholds abstract and contact without consent", () => {
  const detail = toThesisDetail({ ...record, abstractPublic: false, contactPublic: false });
  expect(detail.abstract).toBeNull();
  expect(detail.abstractEn).toBeNull();
  expect(detail.contact).toBeNull();
  expect(detail.repositoryUrl).toBe(record.repositoryUrl);
});

test("detail DTO validates contact and repository URLs", () => {
  expect(toThesisDetail(record).contact).toEqual({
    channel: "email",
    value: "ayu@example.com",
  });
  expect(
    toThesisDetail({ ...record, contactChannel: "url", contactValue: "javascript:alert(1)" })
      .contact,
  ).toBeNull();
  expect(
    toThesisDetail({ ...record, contactChannel: "url", contactValue: "https://example.com/ayu" })
      .contact,
  ).toEqual({ channel: "url", value: "https://example.com/ayu" });
  expect(
    toThesisDetail({ ...record, contactChannel: "email", contactValue: "not-an-email" }).contact,
  ).toBeNull();
  expect(
    toThesisDetail({ ...record, repositoryUrl: "javascript:alert(1)" }).repositoryUrl,
  ).toBeNull();
});

test("soft-deleted lecturers fall back to the snapshot name and lose the link", () => {
  const detail = toThesisDetail({
    ...record,
    supervisors: [
      {
        name: "Dr. Snapshot, M.Kom.",
        lecturerId: "nur-rokhman",
        lecturerName: "Dr. Nur Rokhman",
        lecturerDeletedAt: new Date("2026-01-01T00:00:00Z"),
        role: "main",
      },
    ],
  });
  expect(detail.supervisors).toEqual([
    { name: "Dr. Snapshot, M.Kom.", lecturerId: null, role: "main" },
  ]);
});

test("index data and filters cover title, author, supervisor, keyword, year, type, and field", () => {
  const second: ThesisDetailRecord = {
    ...record,
    id: "kedua-2025",
    title: "Sistem Informasi Akademik",
    authorName: "Bima Contoh",
    year: 2025,
    type: "product-innovation",
    field: "Rekayasa Perangkat Lunak dan Data",
    keywords: ["sistem informasi"],
    supervisors: [
      {
        name: "Dosen Lain",
        lecturerId: null,
        lecturerName: null,
        lecturerDeletedAt: null,
        role: null,
      },
    ],
  };
  const data = composeThesesIndex([record, second]);
  expect(data.years).toEqual([2026, 2025]);
  expect(data.types).toEqual(["skripsi", "product-innovation"]);
  expect(data.fields).toEqual(["Rekayasa Perangkat Lunak dan Data", "Sistem Cerdas"]);
  expect(filterTheses(data.items, { query: "nur rokhman" })).toHaveLength(1);
  expect(filterTheses(data.items, { query: "machine learning" })).toHaveLength(1);
  expect(filterTheses(data.items, { year: 2025 })[0]?.slug).toBe("kedua-2025");
  expect(filterTheses(data.items, { type: "product-innovation" })[0]?.slug).toBe("kedua-2025");
  expect(filterTheses(data.items, { field: "Sistem Cerdas" })[0]?.slug).toBe("contoh-skripsi-2026");
  expect(filterTheses(data.items, { query: "tidak ada" })).toHaveLength(0);
});

test("citations, descriptions, and JSON-LD only include public content", () => {
  const detail = toThesisDetail(record);
  expect(citationFor(detail, "Skripsi")).toContain("Ayu Contoh (2026). Contoh Skripsi");
  expect(citationFor(detail, "Skripsi")).toContain(record.repositoryUrl!);
  expect(metaDescriptionFor(detail, "fallback")).toContain("Abstrak rahasia");
  expect(
    metaDescriptionFor({ ...detail, abstract: "a".repeat(200) }, "fallback").length,
  ).toBeLessThanOrEqual(150);
  expect(metaDescriptionFor({ ...detail, abstract: null }, "fallback")).toContain("Ayu Contoh");
  const jsonLd = jsonLdFor(detail, "https://csugm.andhiki.tech/theses/contoh-skripsi-2026");
  expect(jsonLd).toMatchObject({
    "@type": "Thesis",
    name: "Contoh Skripsi",
    identifier: "contoh-skripsi-2026",
    inLanguage: "id",
    sameAs: record.repositoryUrl,
    educationalLevel: "S1 Ilmu Komputer",
  });
  expect(jsonLd.contributor).toEqual([
    { "@type": "Person", name: "Dr. Nur Rokhman" },
    { "@type": "Person", name: "Dr. Pembimbing Eksternal" },
  ]);
  expect(jsonLd.abstract).toContain("Abstrak rahasia");
  expect(jsonLdFor({ ...detail, abstract: null }, "https://example.com").abstract).toBeUndefined();
});

test("abstract paragraphs and URL helpers keep unsafe values out", () => {
  expect(abstractParagraphs("Satu.\n\nDua.\n\n\nTiga.")).toEqual(["Satu.", "Dua.", "Tiga."]);
  expect(abstractParagraphs(null)).toEqual([]);
  expect(safeHttpUrl("https://example.com/a")).toBe("https://example.com/a");
  expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
  expect(safeHttpUrl("not a url")).toBeNull();
  expect(publicContact("email", "mailto:ayu@example.com")).toEqual({
    channel: "email",
    value: "ayu@example.com",
  });
  expect(publicContact("url", "https://example.com")).toEqual({
    channel: "url",
    value: "https://example.com/",
  });
  expect(publicContact("url", "data:text/html,hi")).toBeNull();
});
