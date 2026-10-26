"""Reconcile the independently numbered 1-89 source entries and table course codes."""
import json
import re
from collections import Counter
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "src/data/syllabi.json").read_text(encoding="utf-8"))["2026"]
source = json.loads((ROOT / "output/data/ugm-ilkom-2026.json").read_text(encoding="utf-8"))
entries = []
with pdfplumber.open(ROOT / "output/sources/fmipa-kurikulum-sarjana-2026.pdf") as pdf:
    for number in range(210, 239):
        text = pdf.pages[number - 1].extract_text() or ""
        for match in re.finditer(r"(?m)^(\d+)\.\s+([A-Z]{3,5}\d{6,8})\s+([^\n]+)", text):
            ordinal, code, title = match.groups()
            record = data.get(code)
            versions = [record, *record.get("alternatives", [])] if record else []
            present = any(version["pdfPage"] == number for version in versions)
            entries.append({"ordinal": int(ordinal), "code": code, "title_raw": title,
                            "pdf_page": number, "printed_page": number - 18,
                            "status": "extracted" if present else "missing"})

counts = Counter(entry["code"] for entry in entries)
schedule = source["course_schedule"]
courses = {}
table_credits = {}
for key in ["required_program_rows", "interest_area_rows", "outside_program_activity_elective_rows"]:
    for row in schedule[key]:
        courses.setdefault(row["course_code_raw"], re.sub(r"\s+", " ", row["course_title_id_raw"]))
        table_credits.setdefault(row["course_code_raw"], set()).add(row["credits_total"])


def normalized_title(title):
    return re.sub(r"\W+", "", re.sub(r"\([^)]*SKS[^)]*\)", "", title).casefold())


missing = []
credit_conflicts = []
for code, title in courses.items():
    if code in data:
        match = re.search(r"\(\s*(\d+)\s*SKS\s*\)", data[code]["title"])
        if match and int(match[1]) not in table_credits[code]:
            credit_conflicts.append({"code": code, "title": title,
                                     "syllabus_credits": int(match[1]),
                                     "table_credits": sorted(table_credits[code]),
                                     "syllabus_pdf_page": data[code]["pdfPage"]})
        continue
    candidates = [{"code": key, "pdf_page": value["pdfPage"], "title_raw": value["title"]}
                  for key, value in data.items()
                  if normalized_title(value["title"]) == normalized_title(title)]
    status = "selection_placeholder" if code == "UNKU26000X" else (
        "source_code_conflict" if candidates else "no_heading_in_audited_ranges")
    missing.append({"code": code, "title": title, "status": status, "source_candidates": candidates})

audit = {
    "source": {"file": "output/sources/fmipa-kurikulum-sarjana-2026.pdf",
               "sha256": source["source"]["sha256"], "syllabus_pdf_ranges": [[39, 44], [210, 238]]},
    "numbered_ilkom_section": {
        "expected_ordinals": [1, 89], "entry_count": len(entries), "unique_codes": len(counts),
        "missing_ordinals": sorted(set(range(1, 90)) - {entry["ordinal"] for entry in entries}),
        "duplicate_codes": [{"code": code, "ordinals": [e["ordinal"] for e in entries if e["code"] == code],
                             "pdf_pages": [e["pdf_page"] for e in entries if e["code"] == code]}
                            for code, count in counts.items() if count > 1],
        "unextracted_entries": [entry for entry in entries if entry["status"] != "extracted"],
        "entries": entries,
    },
    "coverage": {"syllabus_codes": len(data), "table_course_codes": len(courses),
                 "table_codes_with_syllabi": sum(code in data for code in courses),
                 "table_codes_without_syllabi": missing,
                 "source_credit_conflicts": credit_conflicts},
    "limits": ["89 counts numbered Ilkom source entries, not all table courses.",
               "Code conflicts are reported, never automatically aliased by title.",
               "No heading means absent from the audited syllabus ranges, not that a course has no official syllabus."],
}
target = ROOT / "output/data/ugm-ilkom-2026-syllabus-audit.json"
target.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print({"entries": len(entries), "unique_ilkom_codes": len(counts), "missing_entries": len(audit["numbered_ilkom_section"]["unextracted_entries"]),
       "syllabus_codes": len(data), "table_codes_with_syllabi": audit["coverage"]["table_codes_with_syllabi"], "table_codes_without_syllabi": len(missing)})
if len(entries) != 89 or audit["numbered_ilkom_section"]["missing_ordinals"] or audit["numbered_ilkom_section"]["unextracted_entries"]:
    raise SystemExit("Incomplete extraction of the numbered Ilkom syllabus section")
