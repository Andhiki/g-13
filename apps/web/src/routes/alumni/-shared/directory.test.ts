import { expect, test } from "bun:test";
import {
  alumniAvatarTone,
  alumniInitials,
  collectAlumni,
  filterAlumni,
  normalizeLinkedIn,
  sanitizeAlumni,
} from "./directory";

test("private contact fields never survive sanitisation", () => {
  const card = sanitizeAlumni({
    id: 31,
    name: "  Haris   Setyawan ",
    batch: 2001,
    kontak: { linkedin: "https://www.linkedin.com/in/haris-setyawan/" },
    pekerjaan: { currentEmployer: "BPKPD", position: "Sekretaris" },
    // Present in the upstream payload, must not be forwarded.
    phone: "081328677433",
    email: "nggo.haris@gmail.com",
  } as never);
  expect(card).toEqual({
    id: 31,
    name: "Haris Setyawan",
    batch: 2001,
    employer: "BPKPD",
    position: "Sekretaris",
    linkedin: "https://www.linkedin.com/in/haris-setyawan",
  });
  expect(JSON.stringify(card)).not.toContain("0813");
  expect(JSON.stringify(card)).not.toContain("gmail");
});

test("records without a usable name or batch are dropped", () => {
  expect(sanitizeAlumni({ name: "   ", batch: 2020 })).toBeNull();
  expect(sanitizeAlumni({ name: "Tanpa Angkatan" })).toBeNull();
  expect(sanitizeAlumni({ name: "Tahun Aneh", batch: 1800 })).toBeNull();
});

test("LinkedIn URLs are rebuilt from every stored shape", () => {
  const expected = "https://www.linkedin.com/in/faizjazadi";
  for (const input of [
    "https://www.linkedin.com/in/faizjazadi",
    "https://linkedin.com/in/faizjazadi",
    "www.linkedin.com/in/faizjazadi",
    "linkedin.com/in/faizjazadi/",
    "https://id.linkedin.com/in/faizjazadi",
    "https://www.linkedin.com/in/faizjazadi?utm_source=share_via&utm_medium=member_ios",
    "https://www.linkedin.com/in/faizjazadi/?lipi=urn%3Ali%3Apage",
    "  https://www.linkedin.com/in/faizjazadi  ",
  ]) {
    expect(normalizeLinkedIn(input)).toBe(expected);
  }
});

test("non-profile URLs are rejected", () => {
  for (const input of [
    null,
    undefined,
    "",
    "   ",
    "https://www.linkedin.com/company/ugm",
    "https://www.linkedin.com/in/",
    "https://evil.example.com/in/person",
    "javascript:alert(1)",
  ]) {
    expect(normalizeLinkedIn(input)).toBeNull();
  }
});

test("pages are deduplicated and sorted by name across batches", () => {
  const data = collectAlumni([
    {
      data: [
        { id: 1, name: "Budi", batch: 2021, pekerjaan: { currentEmployer: "A", position: "P" } },
        { id: 2, name: "Ani", batch: 2022, pekerjaan: { currentEmployer: "B", position: "Q" } },
      ],
      meta: { pagination: { total: 3 } },
    },
    {
      data: [
        { id: 1, name: "Budi", batch: 2021, pekerjaan: { currentEmployer: "A", position: "P" } },
        { id: 3, name: "Cici", batch: 2022, pekerjaan: { currentEmployer: "C", position: "R" } },
      ],
      meta: { pagination: { total: 3 } },
    },
  ]);
  expect(data.items.map((item) => item.name)).toEqual(["Ani", "Budi", "Cici"]);
  expect(data.batches).toEqual([2022, 2021]);
  expect(data.total).toBe(3);
});

test("upstream failures degrade to an empty directory instead of throwing", () => {
  expect(collectAlumni([{ data: null }, {}])).toEqual({ items: [], batches: [], total: 0 });
});

test("filters combine batch and free text across name, employer, and position", () => {
  const items = collectAlumni([
    {
      data: [
        {
          id: 1,
          name: "Dewi Adelia",
          batch: 2022,
          pekerjaan: { currentEmployer: "Shopee", position: "Data Analyst" },
        },
        {
          id: 2,
          name: "Azhar Bagaskara",
          batch: 2022,
          pekerjaan: { currentEmployer: "CIMB Niaga", position: "Software Developer" },
        },
        {
          id: 3,
          name: "Faizal Makhrus",
          batch: 2002,
          pekerjaan: { currentEmployer: "UGM", position: "Dosen" },
        },
      ],
    },
  ]).items;
  expect(filterAlumni(items, {}).map((item) => item.id)).toEqual([2, 1, 3]);
  expect(filterAlumni(items, { batch: 2022 }).map((item) => item.id)).toEqual([2, 1]);
  expect(filterAlumni(items, { query: "  SHOPEE " }).map((item) => item.id)).toEqual([1]);
  expect(filterAlumni(items, { query: "dosen", batch: 2022 })).toEqual([]);
});

test("initials skip academic titles and stay at two letters", () => {
  expect(alumniInitials("Haris Setyawan, S.Kom, M.S.E")).toBe("HS");
  expect(alumniInitials("Anindito Baskoro Satrianto")).toBe("AS");
  expect(alumniInitials("Rtbrl")).toBe("R");
  expect(alumniInitials("  ")).toBe("?");
});

test("avatar tone is stable for the same record", () => {
  const tone = alumniAvatarTone(31);
  expect(tone).toEqual(alumniAvatarTone(31));
  expect(tone.solid).toMatch(/^bg-\S+ text-\S+$/);
});
