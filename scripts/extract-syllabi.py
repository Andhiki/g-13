"""Extract course syllabi from the checked-in curriculum PDFs (requires pdfplumber)."""
import json
import re
import sys
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
HEADER = re.compile(r"(?m)^(?:\d+\.\s*)?([A-Z]{3,5}-?\d{2,3}-?\d{4,5})\s+([^()]{1,180}\(\s*\d+\s*SKS\s*\))\s*$")
# Alternate source headings have short codes, parenthesized titles, or no SKS suffix.
# The following prerequisite label keeps this fallback out of tables and references.
ALTERNATE_HEADER = re.compile(r"(?m)^(?:\d+\.\s*)?([A-Z]{3,5}(?:-?\d{2,3})?-?\d{4,5})[ \t]+([^\n]{1,180}(?:\n[^\n]{1,180})?)(?=\nPrasyarat\s*:)")


def extract(year, filename, ranges, offset):
    with pdfplumber.open(ROOT / "output/sources" / filename) as pdf:
        pages = []
        for start, end in ranges:
            for number in range(start, end + 1):
                text = pdf.pages[number - 1].extract_text() or ""
                text = re.sub(r"(?m)^(?:Halaman\s*\|\s*\d+|DEPARTEMEN ILMU KOMPUTER DAN ELEKTRONIKA|FAKULTAS|\d+)\s*$", "", text)
                pages.append((number, text))
    return parse_pages(year, pages, offset)


def parse_pages(year, pages, offset):
    combined = ""
    boundaries = []
    for number, text in pages:
        boundaries.append((len(combined), number))
        combined += text + "\n"
    matches = list(HEADER.finditer(combined))
    starts = {match.start() for match in matches}
    matches.extend(match for match in ALTERNATE_HEADER.finditer(combined) if match.start() not in starts)
    matches.sort(key=lambda match: match.start())
    records = {}
    conflicts = set()
    for index, match in enumerate(matches):
        body = combined[match.end():matches[index + 1].start() if index + 1 < len(matches) else len(combined)]
        # 2021 puts a numbered title and English title before each coded heading.
        body = re.split(r"\n\d+\. [^\n]+\n[^\n]+\n?$", body)[0]
        syllabus = re.search(r"Silabus\s*:\s*(.*?)(?=\n(?:Referensi|Buku [Aa]cuan)\b|\Z)", body, re.S)
        if not syllabus:
            continue
        references = re.search(r"(?:Referensi|Buku [Aa]cuan)\s*:?\s*(.*)", body, re.S)
        description = re.search(r"Tujuan Instruksional[^:]*:\s*(.*?)\nSilabus\s*:", body, re.S)
        page = next(number for position, number in reversed(boundaries) if position <= match.start())
        clean = lambda value: re.sub(r"\s+", " ", value).strip()
        code = match[1].replace("-", "")
        record = {
            "title": clean(match[2]),
            "description": clean(description[1]) if description else "",
            "syllabus": clean(syllabus[1]),
            "references": [
                clean(item) for item in re.split(
                    r"(?m)^\s*(?:[●•]|\d+\.\s+|\([a-z]\)\.?\s+)", references[1]
                ) if clean(item)
            ] if references else [],
            "printedPage": page - offset,
            "pdfPage": page,
        }
        if code not in records:
            records[code] = record
        elif records[code]["title"].casefold() == record["title"].casefold():
            records[code].setdefault("alternatives", []).append(record)
        else:
            conflicts.add(code)
            print(
                f"{year}: unresolved code {code}: {records[code]['title']} "
                f"(PDF {records[code]['pdfPage']}) / {record['title']} (PDF {page})",
                file=sys.stderr,
            )
    for code in conflicts:
        del records[code]
    return records


if __name__ == "__main__":
    data = {
        "2021": extract("2021", "fmipa-kurikulum-sarjana-2021-revisi-2023.pdf", [(303, 358)], 15),
        "2026": extract("2026", "fmipa-kurikulum-sarjana-2026.pdf", [(39, 44), (210, 238)], 18),
    }
    (ROOT / "src/data/syllabi.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print({year: len(records) for year, records in data.items()})
