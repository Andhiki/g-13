# UGM S1 Ilmu Komputer Kurikulum 2026 extraction

## Source and scope

This extraction uses only the uploaded PDF `30d5a973-d81a-4fa4-b942-2fc419f5811b-f99cecdf-5f27-4dca-827d-49dd2bd1404c-pdf.pdf` (SHA-256 `ffa6d141c99228b79092d9da647f47e9b37d2966f6aca8ca9567de8b7a506520`, 505 PDF pages). Chapter 3.2 runs from printed pages 154–220 (1-based PDF pages 172–238); section 3.3 begins on printed page 221 / PDF page 239.

The extraction keeps required, interest-area, outside-program activity, equivalency, and transition table rows in structured form in `packages/curriculum/src/curricula/2026/source.json`. The companion `output/data/ugm-ilkom-2026-pages.json` retains extracted text for all 67 chapter pages. CPL text and other chapter prose remain available there. Individual syllabus records live in each curriculum slice as `syllabi.json`, with printed/PDF page provenance. See [the import guide](curriculum-import.md) for the output contract.

### Syllabus duplicate audit (2026-10-26)

The syllabus range (PDF pp. 210–238) contains all 89 numbered headings (1–89), with 88 unique codes.
The 2026 extraction also includes 18 shared university/faculty syllabi on PDF pp. 39–44,
for 106 unique syllabus codes in total. Matching these against 108 table course codes
yields 97 direct matches and 11 unresolved rows; see [the coverage audit](ilkom-2026-coverage-audit.md).
`PACS262413` Pembelajaran Mesin occurs twice: printed p. 199 / PDF p. 217 and
printed p. 211 / PDF p. 229. The topic lists differ. Both source versions are kept:
the first occurrence is the main record and the second is in `alternatives`.
Their order follows the PDF and does not indicate authority or recency. The reader
shows both versions with separate page references; no topics are merged or inferred.

PDF-specific extraction scripts have been retired because document layouts change. Follow [the import guide](curriculum-import.md), preserve matching-title duplicate versions, and leave codes reused for different titles unresolved. Validate with `bun run check`.
The 2021 source has such an unresolved collision at `MII213603` (PDF p. 338:
Lingkungan Cerdas dan Intelijen / Pengantar Blockchain); that code remains excluded.

## Structured coverage and checks

- Table 3.12: 55 required-program schedule rows, 64 interest-area rows, and 9 outside-program activity rows. Repeated semester placements and repeated offerings across interest areas remain separate rows.
- The 55 required-program placements contain 46 unique course codes. Counting each code once gives 109 SKS, matching the chapter's stated required-program total. The displayed semester totals are 20, 20, 21, 18, 9, 16, 19, and 9 SKS; all match the rows shown. Their sum is 132 because some courses appear in multiple semester placements, so this is not the unique required-course total.
- The six table interest areas contain 25 WM and 39 P rows. WM totals by area are Analisis Data 9, Komputasi Cerdas 10, Kecerdasan Artifisial 15, Rekayasa Perangkat Lunak 12, Infrastruktur Komputasi 12, and Wirausaha Digital 15 SKS; each falls within the source's 9–15 SKS range.
- Table 3.13 contains 24 old-course rows; all 13 transition rules are retained. Rows 3–4 share a visually merged target cell, “Probabilitas dan Statistik” (3 SKS), consistent with transition rule 13.
- Every structured row has both printed-page and 1-based PDF-page provenance. The source hash is embedded in the JSON.
- Table 3.12 gives one total SKS value per row; theory/practical splits are null. Its “Sem” field is captured as semester guidance; no separate offering-availability schedule is claimed.

## Ambiguities preserved

- The religion row uses generic code `UNKU26000X`, while its footnote lists seven concrete course codes; both forms are preserved.
- Semester 1 Praktikum Pemrograman lists `Pemrograman (1)*` as a prerequisite in the same planned semester. The legend says a starred prerequisite has been taken before but need not be passed; timing remains unresolved, so no concurrency rule is inferred.
- A shared “Diambil sebelum pemberangkatan KKN” condition covers Literasi Kesehatan, KKN-PPM, Komunikasi Masyarakat, and Penerapan Manajemen Pengetahuan; the footnote says all four precede KKN implementation. This leaves an operational self-reference for KKN-PPM. It is kept as a group condition and not converted into a KKN-PPM self-prerequisite.
- Proposal Tugas Akhir is repeated in semesters 6–8. Its prerequisite text explicitly allows required and required-interest courses to be taken in the same semester; the row is preserved as printed.
- Courses can appear in several interest areas and be WM in one area but P in another. No cross-area deduplication is applied.
- The prose list calls the sixth area “Kewirausahaan Digital”; Table 3.12 calls it “Wirausaha Digital”. Both labels are preserved.
- PDF table extraction omitted the final Analisis Data row at the table boundary. `PACS262530` was added from the page text and flagged in the course record.

## Coverage limits

The text companion retains extracted text, not page images. Printed pages 182–188 (PDF 200–206) contain curriculum-map diagrams with sparse extracted text; the interest-specific course blocks on PDF pp. 201–206 have now been visually transcribed
into `output/data/ugm-ilkom-2026-interest-maps.json`. This includes 57 named placements,
WM/P roles, credits, semesters, generic choice buckets and selection notes. The shared
required-course nodes and arrow connections remain untranscribed. Diagram/table
differences are retained separately; the application continues to use its existing table data. Tables 3.8–3.11 and CPL mapping remain in the page-text companion rather than normalized fields. Syllabus topics and references are also available in `packages/curriculum/src/curricula/2026/syllabi.json`; the duplicate audit above describes the unresolved source limits. English titles and source spelling are kept as printed, including wording that may look incomplete or inconsistent.
