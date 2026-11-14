-- Initial lecturer list is maintained from the public DIKE UGM faculty directory:
-- https://dcse.fmipa.ugm.ac.id/dosen/ (reviewed 2026-11-14).
INSERT INTO lecturers (id, name) VALUES
  ('afiahayati', 'Afiahayati'),
  ('ahmad-ashari', 'Ahmad Ashari'),
  ('aina-musdholifah', 'Aina Musdholifah'),
  ('arif-nurwidyantoro', 'Arif Nurwidyantoro'),
  ('edi-winarko', 'Edi Winarko'),
  ('faizal-makhrus', 'Faizal Makhrus'),
  ('guntur-budi-herwanto', 'Guntur Budi Herwanto'),
  ('lukman-heryawan', 'Lukman Heryawan')
ON CONFLICT (id) DO UPDATE SET name = excluded.name;

-- Course names follow the independent review-course catalog for the 2026 curriculum.
INSERT INTO courses (id, code, name_id, name_en) VALUES
  ('review-2026-PAKF262101', 'PAKF262101', 'Sains dan Inovasi', 'Science and Innovations'),
  ('review-2026-PAKF262105', 'PAKF262105', 'Pemrograman', 'Programming'),
  ('review-2026-PACS262102', 'PACS262102', 'Logika Informatika', 'Logic for Computer Science'),
  ('review-2026-PACS262103', 'PACS262103', 'Matematika Diskrit', 'Discrete Mathematics'),
  ('review-2026-PACS262201', 'PACS262201', 'Algoritma dan Struktur Data', 'Algorithms and Data Structures'),
  ('review-2026-PACS262202', 'PACS262202', 'Jaringan Komputer', 'Computer Networks'),
  ('review-2026-PACS262301', 'PACS262301', 'Basis Data', 'Database'),
  ('review-2026-PACS262302', 'PACS262302', 'Desain dan Analisis Algoritma', 'Design and Analysis of Algorithms'),
  ('review-2026-PACS262304', 'PACS262304', 'Kecerdasan Artifisial', 'Artificial Intelligence'),
  ('review-2026-PACS262308', 'PACS262308', 'Kriptografi dan Keamanan Informasi', 'Cryptography and Information Security'),
  ('review-2026-PACS262313', 'PACS262313', 'Sistem Operasi', 'Operating Systems'),
  ('review-2026-PACS262413', 'PACS262413', 'Pembelajaran Mesin', 'Machine Learning'),
  ('review-2026-PACS262411', 'PACS262411', 'Metode Rekayasa Perangkat Lunak', 'Software Engineering Methods'),
  ('review-2026-PACS262412', 'PACS262412', 'Metodologi Penelitian Ilmu Komputer', 'Computer Science Research Methodology')
ON CONFLICT (id) DO UPDATE SET
  code = excluded.code,
  name_id = excluded.name_id,
  name_en = excluded.name_en;
