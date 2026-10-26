import runpy
import unittest
from pathlib import Path

parse_pages = runpy.run_path(str(Path(__file__).with_name("extract-syllabi.py")))["parse_pages"]


class SyllabusExtractionTests(unittest.TestCase):
    def test_repeated_course_preserves_both_source_versions(self):
        pages = [
            (217, "21. PACS262413 Pembelajaran Mesin (3 SKS)\nSilabus:\nFirst topics\nReferensi:\nBook A"),
            (229, "58. PACS262413 Pembelajaran Mesin (3 SKS)\nSilabus:\nSecond topics\nReferensi:\nBook B"),
        ]
        record = parse_pages("2026", pages, 18)["PACS262413"]
        self.assertEqual(record["syllabus"], "First topics")
        self.assertEqual(record["printedPage"], 199)
        alternative = record["alternatives"][0]
        self.assertEqual(alternative["syllabus"], "Second topics")
        self.assertEqual(alternative["references"], ["Book B"])
        self.assertEqual(alternative["pdfPage"], 229)
        self.assertEqual(alternative["printedPage"], 211)

    def test_reused_code_for_different_courses_stays_unresolved(self):
        pages = [(338, "MII21-3603 Course A (3 SKS)\nSilabus:\nTopics A\nMII21-3603 Course B (3 SKS)\nSilabus:\nTopics B")]
        self.assertNotIn("MII213603", parse_pages("2021", pages, 15))


if __name__ == "__main__":
    unittest.main()
