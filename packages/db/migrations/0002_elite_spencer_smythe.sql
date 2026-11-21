CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title_id` text NOT NULL,
	`title_en` text NOT NULL,
	`body_id` text NOT NULL,
	`body_en` text NOT NULL,
	`cta_href` text,
	`cta_label_id` text,
	`cta_label_en` text,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`enabled` integer DEFAULT true NOT NULL,
	`created_by_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`created_by_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "announcements_window" CHECK("announcements"."ends_at" is null or "announcements"."ends_at" > "announcements"."starts_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `announcements_slug_unique` ON `announcements` (`slug`);--> statement-breakpoint
-- Seed the course catalog from packages/curriculum (2021 + 2026 editions).
-- 146 canonical courses: one row per course, so a course taught in both editions is stored
-- once under its newest code and 46 superseded codes are merged below. Names are compared
-- case- and punctuation-insensitively with roman numerals folded to digits, so "Kalkulus I" and
-- "Kalkulus 1" count as the same course.
-- Excluded on purpose: elective placeholders without a code, "Aktivitas di luar program studi"
-- entries, MBKM-style activities (internship, assistantship, independent/community projects,
-- research, entrepreneurship, soft skills), and thesis/proposal/work-practice courses.
INSERT INTO `courses` (`id`, `code`, `name_id`, `name_en`) VALUES
	('MFF-1011', 'MFF-1011', 'Fisika Dasar 1', 'Basic Physics 1'),
	('MII21-1001', 'MII21-1001', 'Aljabar Linier Fundamental', 'Elementary Linear Algebra'),
	('MII21-1004', 'MII21-1004', 'Bahasa Inggris', 'English'),
	('MII21-1005', 'MII21-1005', 'Integral dan Persamaan Diferensial', 'Integral and Differential Equations'),
	('MII21-1007', 'MII21-1007', 'Pengantar Statistika', 'Introduction to Statistics'),
	('MII21-2001', 'MII21-2001', 'Probabilitas dan Proses Stokastika', 'Probability and Stochastic Processes'),
	('MII21-2003', 'MII21-2003', 'Pengembangan Startup Digital', 'Startup Digital Development'),
	('MII21-2010', 'MII21-2010', 'Penulisan Akademik dan Etika', 'Academic Writing & Ecthics'),
	('MII21-2201', 'MII21-2201', 'Analisis Algoritma dan Kompleksitas', 'Analysis of Algorithm and Complexity'),
	('MII21-2202', 'MII21-2202', 'Bahasa dan Otomata', 'Languages dan Automata'),
	('MII21-2206', 'MII21-2206', 'Penglihatan Komputer dan Analisis Citra', 'Computer Vision and Image Analysis'),
	('MII21-2410', 'MII21-2410', 'Tren Penelitian Sistem Cerdas', 'Research Trends on Artificial Intelligence'),
	('MII21-2504', 'MII21-2504', 'Workshop Implementasi Rancangan Perangkat Lunak', 'Workshop on Implementing Software Design'),
	('MII21-2505', 'MII21-2505', 'Pengembangan UI/UX & Front-end', 'Frontend and UI/UX development'),
	('MII21-2603', 'MII21-2603', 'Praktikum Sistem Komputer dan Jaringan', 'Computer System and Network Lab work'),
	('MII21-2605', 'MII21-2605', 'Perkembangan Terbaru Penelitian Sistem Komputer dan Jaringan', 'Computer Systems and Network Research Trends'),
	('MII21-2606', 'MII21-2606', 'Internet of Things dan Aplikasinya', 'Internet of Things and Applications'),
	('MII21-2607', 'MII21-2607', 'Arsitektur dan Teknologi Data Besar', 'Big Data Architecture and Infrastructure'),
	('MII21-2611', 'MII21-2611', 'Telekomunikasi Generasi Lanjut', 'Next Generation Networks'),
	('MII21-3017', 'MII21-3017', 'Industri Kreatif dan Game Digital', 'Creative Industry and Digital Game'),
	('MII21-30450', 'MII21-30450', 'Poster Ilmiah Bidang Ilmu Komputer', 'Scholarly Poster in Computer Science'),
	('MII21-30451', 'MII21-30451', 'Publikasi Akademik Bidang Ilmu Komputer', 'Academic Publication in Computer Science'),
	('MII21-30452', 'MII21-30452', 'Publikasi ilmiah Bereputasi International', 'International Reputed Scientific Publication'),
	('MII21-3090', 'MII21-3090', 'Tantangan dan Pengalaman Informatika', 'Informatics Challenge and Experiences'),
	('MII21-3091', 'MII21-3091', 'Kompetisi Inovasi Digital Mahasiswa', 'Student Digital Innovation Competition'),
	('MII21-3092', 'MII21-3092', 'Pengembangan Kinerja Talenta Digital Kreatif Internasional', 'Performance Development of International Digital Creative Talent'),
	('MII21-3203', 'MII21-3203', 'Simulasi Sains', 'Science Simulation'),
	('MII21-3204', 'MII21-3204', 'Tren Penelitian Algoritma dan Komputasi', 'Research Trends in Algorithm and Computation'),
	('MII21-3207', 'MII21-3207', 'Verifikasi Formal', 'Formal Verification'),
	('MII21-3208', 'MII21-3208', 'Computational Thinking', 'Computational Thinking'),
	('MII21-3501', 'MII21-3501', 'Proyek Rekayasa Perangkat Lunak', 'Software Engineering Project'),
	('MII21-3502', 'MII21-3502', 'Web Semantik', 'Semantic Web'),
	('MII21-3503', 'MII21-3503', 'Temu Kembali Informasi', 'Information Retrieval System'),
	('MII21-3504', 'MII21-3504', 'Pengantar Penjaminan Kualitas Perangkat Lunak', 'Introduction to Software Quality Assurance'),
	('MII21-3505', 'MII21-3505', 'Audit dan Forensik Digital', 'Audit and Digital Forensic'),
	('MII21-3506', 'MII21-3506', 'Manajemen Proyek Teknologi Informasi', 'Information Technology Project Management'),
	('MII21-3507', 'MII21-3507', 'Analisis Big Data', 'Big Data Analytics'),
	('MII21-3508', 'MII21-3508', 'Penambangan Data', 'Data Mining'),
	('MII21-3509', 'MII21-3509', 'Kapita Selekta Lab. RPLD', 'Special Topic on Software Engineering and Data'),
	('MII21-3510', 'MII21-3510', 'Tren Penelitian Rekayasa Perangkat Lunak dan Data', 'Research Trends in Software and Data Engineering'),
	('MII21-3511', 'MII21-3511', 'Pemodelan Jaringan Komunitas Digital', 'Digital Society Network Modelling'),
	('MII21-3512', 'MII21-3512', 'Pengembangan Aplikasi Mobile', 'Mobile Application Development'),
	('MII21-3603', 'MII21-3603', 'Lingkungan Cerdas dan Intelijen', 'Smart and Intelligent Environment'),
	('MII21-3608', 'MII21-3608', 'Pengantar Blockchain', 'Pengantar Blockchain'),
	('MII21-38..', 'MII21-38..', 'Sertifikasi untuk Pemula/Asisten ***', 'Sertification for Assosiate ***'),
	('MII21-4030', 'MII21-4030', 'Hard skill: Manajemen Waktu dan Penjadwalan', 'Time Management Training'),
	('MII21-4031', 'MII21-4031', 'Hard skill: Majemen Perencanaan Produk', 'Planning Training'),
	('MII21-4032', 'MII21-4032', 'Hard skill: Pemecahan Masalah', 'Problem Solver Training'),
	('MII21-4033', 'MII21-4033', 'Hard skill: Pengelolaan Anggaran Organisasi', 'Budgeting Training'),
	('MII21-4034', 'MII21-4034', 'Hard skill: Manajemen Risiko', 'Risk Management Training'),
	('MKK-1101', 'MKK-1101', 'Kimia Dasar 1', 'Basic Chemistry 1'),
	('PACS262101', 'PACS262101', 'Aljabar Vektor dan Matriks', 'Vector and Matrix Algebra'),
	('PACS262102', 'PACS262102', 'Logika Informatika', 'Logic for Computer Science'),
	('PACS262103', 'PACS262103', 'Matematika Diskrit', 'Discrete Mathematics'),
	('PACS262201', 'PACS262201', 'Algoritma dan Struktur Data', 'Algorithms and Data Structures'),
	('PACS262202', 'PACS262202', 'Jaringan Komputer', 'Computer Networks'),
	('PACS262203', 'PACS262203', 'Kalkulus Vektor dan Integral', 'Vector Calculus and Integral'),
	('PACS262204', 'PACS262204', 'Organisasi dan Arsitektur Komputer', 'Computer Organization and Architecture'),
	('PACS262205', 'PACS262205', 'Praktikum Algoritma dan Struktur Data', 'Algorithms and Data Structures Laboratory'),
	('PACS262206', 'PACS262206', 'Probabilitas dan Statistika', 'Probability and Statistics'),
	('PACS262207', 'PACS262207', 'Sistem Digital', 'Digital Systems'),
	('PACS262301', 'PACS262301', 'Basis Data', 'Database'),
	('PACS262302', 'PACS262302', 'Desain dan Analisis Algoritma', 'Design and Analysis of Algorithms'),
	('PACS262303', 'PACS262303', 'Grafika Komputer', 'Computer Graphics'),
	('PACS262304', 'PACS262304', 'Kecerdasan Artifisial', 'Artificial Intelligence'),
	('PACS262307', 'PACS262307', 'Konsep Bahasa Pemrograman', 'Programming Language Concepts'),
	('PACS262308', 'PACS262308', 'Kriptografi dan Keamanan Informasi', 'Cryptography and Information Security'),
	('PACS262309', 'PACS262309', 'Metode Numerik', 'Numerical Methods'),
	('PACS262310', 'PACS262310', 'Pengolahan Citra Digital', 'Digital Image Processing'),
	('PACS262311', 'PACS262311', 'Penulisan dan Integritas Akademik', 'Academic Writing and Integrity'),
	('PACS262312', 'PACS262312', 'Praktikum Basis Data', 'Database Laboratory'),
	('PACS262313', 'PACS262313', 'Sistem Operasi', 'Operating Systems'),
	('PACS262314', 'PACS262314', 'Teori Bahasa dan Otomata', 'Theory of Languages and Automata'),
	('PACS262401', 'PACS262401', 'Algoritma Terdistribusi dan Pemrograman Paralel', 'Distributed Algorithms and Parallel Programming'),
	('PACS262402', 'PACS262402', 'Algoritma untuk Trading', 'Algorithms for Trading'),
	('PACS262403', 'PACS262403', 'Analisis Produk untuk Pengusaha Digital', 'Product Analytics for Digital Entrepreneurs'),
	('PACS262404', 'PACS262404', 'Desain Compiler', 'Compiler Design'),
	('PACS262405', 'PACS262405', 'Ekosistem dan Platform Digital', 'Digital Ecosystem and Platform'),
	('PACS262406', 'PACS262406', 'Keamanan Sistem dan Siber', 'System and Cyber Security'),
	('PACS262407', 'PACS262407', 'Komputasi Awan', 'Cloud Computing'),
	('PACS262408', 'PACS262408', 'Logika Fuzzy', 'Fuzzy Logic'),
	('PACS262409', 'PACS262409', 'Manajemen Proyek', 'Project Management'),
	('PACS262410', 'PACS262410', 'Metode Optimasi', 'Optimization Methods'),
	('PACS262411', 'PACS262411', 'Metode Rekayasa Perangkat Lunak', 'Software Engineering Methods'),
	('PACS262412', 'PACS262412', 'Metodologi Penelitian Ilmu Komputer', 'Computer Science Research Methodology'),
	('PACS262413', 'PACS262413', 'Pembelajaran Mesin', 'Machine Learning'),
	('PACS262414', 'PACS262414', 'Pemrograman Kompetitif', 'Competitive Programming'),
	('PACS262415', 'PACS262415', 'Pengantar Teknologi Blockchain', 'Introduction to Blockchain Technology'),
	('PACS262416', 'PACS262416', 'Pengembangan UI/UX', 'UI/UX Development'),
	('PACS262417', 'PACS262417', 'Penglihatan Komputer dan Analisis Visual', 'Computer Vision and Visual Analysis'),
	('PACS262418', 'PACS262418', 'Praktikum Sistem Operasi dan Jaringan', 'Operating Systems and Networks Laboratory'),
	('PACS262419', 'PACS262419', 'Rekayasa Pengetahuan', 'Knowledge Engineering'),
	('PACS262420', 'PACS262420', 'Sistem Pakar', 'Expert Systems'),
	('PACS262421', 'PACS262421', 'Sistem Pendukung Keputusan', 'Decision Support Systems'),
	('PACS262422', 'PACS262422', 'Temu Balik Informasi', 'Information Retrieval'),
	('PACS262423', 'PACS262423', 'Ventura Digital dan Inovasi Bisnis', 'Digital Venture and Business Innovation'),
	('PACS262424', 'PACS262424', 'Workshop Proyek Kecerdasan Artifisial', 'Artificial Intelligence Project Workshop'),
	('PACS262425', 'PACS262425', 'Workshop Rekayasa Perangkat Lunak', 'Software Engineering Workshop'),
	('PACS262501', 'PACS262501', 'Algoritma Genetika', 'Genetic Algorithms'),
	('PACS262502', 'PACS262502', 'Arsitektur dan Infrastruktur Berkinerja Tinggi', 'High Performance Architecture and Infrastructure'),
	('PACS262503', 'PACS262503', 'Bioinformatika', 'Bioinformatics'),
	('PACS262504', 'PACS262504', 'Data Sains', 'Data Science'),
	('PACS262505', 'PACS262505', 'Kajian Literatur', 'Literature Review'),
	('PACS262506', 'PACS262506', 'Kapasitas Manusia & Inovasi', 'Human Capacity & Innovation'),
	('PACS262507', 'PACS262507', 'Kapita Selekta Algoritma dan Komputasi', 'Selected Topics in Algorithms and Computing'),
	('PACS262508', 'PACS262508', 'Kapita Selekta Rekayasa Perangkat Lunak dan Data', 'Selected Topics in Software Engineering and Data'),
	('PACS262509', 'PACS262509', 'Kapita Selekta Sistem Komputer dan Jaringan', 'Selected Topics in Computer Systems and Networks'),
	('PACS262510', 'PACS262510', 'Kepemimpinan Adaptif dan Organisasi Cerdas', 'Adaptive Leadership and Intelligent Organization'),
	('PACS262511', 'PACS262511', 'Ketahanan Perusahaan dan Strategi Co- Intelligent', 'Enterprise Resilience and Co-Intelligent Strategy'),
	('PACS262512', 'PACS262512', 'Keuangan dan Investasi Perusahaan Rintisan', 'Startup Finance and Investment'),
	('PACS262514', 'PACS262514', 'Olahraga dan Seni', 'Sports and Arts'),
	('PACS262515', 'PACS262515', 'Pemasaran dan Pelanggan berbasis AI', 'AI-driven Marketing and Customer'),
	('PACS262516', 'PACS262516', 'Pembelajaran Mesin Mendalam', 'Deep Learning'),
	('PACS262517', 'PACS262517', 'Pemodelan & Simulasi', 'Modeling and Simulation'),
	('PACS262518', 'PACS262518', 'Pemrosesan Bahasa Alami', 'Natural Language Processing'),
	('PACS262519', 'PACS262519', 'Pengantar Sistem Siber-Fisik', 'Introduction to Cyberphysical Systems'),
	('PACS262520', 'PACS262520', 'Pengembangan Perangkat Lunak berbasis Platform', 'Platform Based Software Development'),
	('PACS262521', 'PACS262521', 'Pengembangan Perangkat Lunak Scalable', 'Scalable Software Development'),
	('PACS262522', 'PACS262522', 'Pengembangan Pusat Komputasi Data', 'Data Computing Center Development'),
	('PACS262523', 'PACS262523', 'Pengenalan Pola', 'Pattern Recognition'),
	('PACS262524', 'PACS262524', 'Penjaminan Kualitas Perangkat Lunak', 'Software Quality Assurance'),
	('PACS262525', 'PACS262525', 'Proyek Capstone', 'Capstone Project'),
	('PACS262526', 'PACS262526', 'Rekayasa Data', 'Data Engineering'),
	('PACS262527', 'PACS262527', 'Rekayasa Model Kecerdasan Artifisial', 'AI Model Engineering'),
	('PACS262528', 'PACS262528', 'Sains Manajemen', 'Science Management'),
	('PACS262529', 'PACS262529', 'Strategi Bisnis Eksekutif CEO Digital', 'Digital CEO Executive Business Strategy'),
	('PACS262530', 'PACS262530', 'Tren Penelitian Ilmu Komputer dan Elektronika', 'Trends in Computer Science and Electronics Research'),
	('PACS262601', 'PACS262601', 'Audit Teknologi Informasi', 'IT Audit'),
	('PACS262602', 'PACS262602', 'Hukum dan Tata Kelola Bisnis Digital', 'Digital Business Law and Governance'),
	('PACS262603', 'PACS262603', 'Industri Perangkat Lunak Adaptif berbasis Agentik', 'Agentic Adaptive Software Industry'),
	('PACS262604', 'PACS262604', 'Kapita Selekta Sistem Cerdas', 'Selected Topics in Intelligent Systems'),
	('PACS262610', 'PACS262610', 'Pengembangan Karier Cerdas dan Profesional', 'Intelligent and Professional Career Development'),
	('PAKF262101', 'PAKF262101', 'Sains dan Inovasi', 'Science and Innovations'),
	('PAKF262103', 'PAKF262103', 'Kalkulus I', 'Calculus 1'),
	('PAKF262105', 'PAKF262105', 'Pemrograman', 'Programming'),
	('PAKF262106', 'PAKF262106', 'Praktikum Pemrograman', 'Programming Laboratory'),
	('UNKU260008', 'UNKU260008', 'Pancasila', 'Pancasila'),
	('UNKU260009', 'UNKU260009', 'Kewarganegaraan', 'Citizenship'),
	('UNKU26000X', 'UNKU26000X', 'Agama', 'Religion'),
	('UNKU260010', 'UNKU260010', 'Bahasa Indonesia', 'Indonesian Language'),
	('UNKU260011', 'UNKU260011', 'Literasi Kesehatan**', 'Health Literacy'),
	('UNKU260012', 'UNKU260012', 'Humaniora Digital', 'Digital Humanities'),
	('UNKU260013', 'UNKU260013', 'Keterampilan Masa Depan Berkelanjutan', 'Sustainable Future Skills'),
	('UNKU260014', 'UNKU260014', 'KKN-PPM**', 'Community Service Program'),
	('UNKU260015', 'UNKU260015', 'Komunikasi Masyarakat**', 'Community Communication'),
	('UNKU260016', 'UNKU260016', 'Penerapan Manajemen Pengetahuan**', 'Implementation of Knowledge Management')
ON CONFLICT(`id`) DO UPDATE SET
	`code` = excluded.`code`,
	`name_id` = excluded.`name_id`,
	`name_en` = excluded.`name_en`;
--> statement-breakpoint
-- The course code is now the identity. Older rows used generated ids (for example
-- 'review-2026-PACS262102'); give every one of them a row keyed by its code first so the
-- review foreign keys have a valid target.
INSERT INTO `courses` (`id`, `code`, `name_id`, `name_en`, `deleted_at`)
	SELECT `code`, `code`, `name_id`, `name_en`, `deleted_at` FROM `courses`
	WHERE `code` <> '' AND `id` <> `code`
	ON CONFLICT(`id`) DO NOTHING;
--> statement-breakpoint
-- A course taught in both editions under different codes keeps one identity: move its reviews to
-- the newest code before the superseded row is removed.
UPDATE `reviews` SET `course_id` = 'PACS262102' WHERE `course_id` = 'MII21-1002';
UPDATE `reviews` SET `course_id` = 'PACS262103' WHERE `course_id` = 'MII21-1006';
UPDATE `reviews` SET `course_id` = 'PAKF262105' WHERE `course_id` = 'MII21-1201';
UPDATE `reviews` SET `course_id` = 'PAKF262106' WHERE `course_id` = 'MII21-1202';
UPDATE `reviews` SET `course_id` = 'PACS262201' WHERE `course_id` = 'MII21-1203';
UPDATE `reviews` SET `course_id` = 'PACS262205' WHERE `course_id` = 'MII21-1204';
UPDATE `reviews` SET `course_id` = 'PACS262204' WHERE `course_id` = 'MII21-1601';
UPDATE `reviews` SET `course_id` = 'PACS262207' WHERE `course_id` = 'MII21-1602';
UPDATE `reviews` SET `course_id` = 'PACS262309' WHERE `course_id` = 'MII21-2203';
UPDATE `reviews` SET `course_id` = 'PACS262310' WHERE `course_id` = 'MII21-2204';
UPDATE `reviews` SET `course_id` = 'PACS262303' WHERE `course_id` = 'MII21-2205';
UPDATE `reviews` SET `course_id` = 'PACS262308' WHERE `course_id` = 'MII21-2209';
UPDATE `reviews` SET `course_id` = 'PACS262304' WHERE `course_id` = 'MII21-2401';
UPDATE `reviews` SET `course_id` = 'PACS262413' WHERE `course_id` = 'MII21-2402';
UPDATE `reviews` SET `course_id` = 'PACS262408' WHERE `course_id` = 'MII21-2404';
UPDATE `reviews` SET `course_id` = 'PACS262523' WHERE `course_id` = 'MII21-2405';
UPDATE `reviews` SET `course_id` = 'PACS262301' WHERE `course_id` = 'MII21-2501';
UPDATE `reviews` SET `course_id` = 'PACS262312' WHERE `course_id` = 'MII21-2502';
UPDATE `reviews` SET `course_id` = 'PACS262411' WHERE `course_id` = 'MII21-2503';
UPDATE `reviews` SET `course_id` = 'PACS262521' WHERE `course_id` = 'MII21-2506';
UPDATE `reviews` SET `course_id` = 'PACS262202' WHERE `course_id` = 'MII21-2601';
UPDATE `reviews` SET `course_id` = 'PACS262313' WHERE `course_id` = 'MII21-2602';
UPDATE `reviews` SET `course_id` = 'PACS262509' WHERE `course_id` = 'MII21-2608';
UPDATE `reviews` SET `course_id` = 'PACS262522' WHERE `course_id` = 'MII21-2609';
UPDATE `reviews` SET `course_id` = 'PACS262407' WHERE `course_id` = 'MII21-2610';
UPDATE `reviews` SET `course_id` = 'PACS262412' WHERE `course_id` = 'MII21-3002';
UPDATE `reviews` SET `course_id` = 'PACS262410' WHERE `course_id` = 'MII21-3201';
UPDATE `reviews` SET `course_id` = 'PACS262528' WHERE `course_id` = 'MII21-3202';
UPDATE `reviews` SET `course_id` = 'PACS262507' WHERE `course_id` = 'MII21-3205';
UPDATE `reviews` SET `course_id` = 'PACS262401' WHERE `course_id` = 'MII21-3206';
UPDATE `reviews` SET `course_id` = 'PACS262516' WHERE `course_id` = 'MII21-3401';
UPDATE `reviews` SET `course_id` = 'PACS262501' WHERE `course_id` = 'MII21-3402';
UPDATE `reviews` SET `course_id` = 'PACS262503' WHERE `course_id` = 'MII21-3403';
UPDATE `reviews` SET `course_id` = 'PACS262518' WHERE `course_id` = 'MII21-3404';
UPDATE `reviews` SET `course_id` = 'PACS262420' WHERE `course_id` = 'MII21-3405';
UPDATE `reviews` SET `course_id` = 'PACS262421' WHERE `course_id` = 'MII21-3406';
UPDATE `reviews` SET `course_id` = 'PACS262604' WHERE `course_id` = 'MII21-3407';
UPDATE `reviews` SET `course_id` = 'PACS262502' WHERE `course_id` = 'MII21-3601';
UPDATE `reviews` SET `course_id` = 'PACS262406' WHERE `course_id` = 'MII21-3602';
UPDATE `reviews` SET `course_id` = 'PAKF262103' WHERE `course_id` = 'MMM-1101';
UPDATE `reviews` SET `course_id` = 'UNKU260014' WHERE `course_id` = 'UNU22-2001';
UPDATE `reviews` SET `course_id` = 'UNKU260015' WHERE `course_id` = 'UNU22-2002';
UPDATE `reviews` SET `course_id` = 'UNKU260016' WHERE `course_id` = 'UNU22-2004';
UPDATE `reviews` SET `course_id` = 'UNKU260008' WHERE `course_id` = 'UNU22-2011';
UPDATE `reviews` SET `course_id` = 'UNKU260009' WHERE `course_id` = 'UNU22-2012';
UPDATE `reviews` SET `course_id` = 'UNKU260010' WHERE `course_id` = 'UNU22-2013';
--> statement-breakpoint
DELETE FROM `courses` WHERE `id` IN (
	'MII21-1002',
	'MII21-1006',
	'MII21-1201',
	'MII21-1202',
	'MII21-1203',
	'MII21-1204',
	'MII21-1601',
	'MII21-1602',
	'MII21-2203',
	'MII21-2204',
	'MII21-2205',
	'MII21-2209',
	'MII21-2401',
	'MII21-2402',
	'MII21-2404',
	'MII21-2405',
	'MII21-2501',
	'MII21-2502',
	'MII21-2503',
	'MII21-2506',
	'MII21-2601',
	'MII21-2602',
	'MII21-2608',
	'MII21-2609',
	'MII21-2610',
	'MII21-3002',
	'MII21-3201',
	'MII21-3202',
	'MII21-3205',
	'MII21-3206',
	'MII21-3401',
	'MII21-3402',
	'MII21-3403',
	'MII21-3404',
	'MII21-3405',
	'MII21-3406',
	'MII21-3407',
	'MII21-3601',
	'MII21-3602',
	'MMM-1101',
	'UNU22-2001',
	'UNU22-2002',
	'UNU22-2004',
	'UNU22-2011',
	'UNU22-2012',
	'UNU22-2013'
);
--> statement-breakpoint
DELETE FROM `courses`
	WHERE `id` <> `code` AND `code` <> ''
	AND EXISTS (SELECT 1 FROM `courses` c WHERE c.`id` = `courses`.`code`);
