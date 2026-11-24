CREATE TABLE `thesis_fields` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`lab` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "thesis_fields_name_not_empty" CHECK(length(trim("thesis_fields"."name")) > 0),
	CONSTRAINT "thesis_fields_lab_not_empty" CHECK(length(trim("thesis_fields"."lab")) > 0),
	CONSTRAINT "thesis_fields_position_valid" CHECK("thesis_fields"."position" >= 0)
);
--> statement-breakpoint
CREATE INDEX `thesis_fields_lab_position_idx` ON `thesis_fields` (`lab`,`position`);--> statement-breakpoint
CREATE TABLE `thesis_field_links` (
	`thesis_id` text NOT NULL,
	`field_id` text NOT NULL,
	PRIMARY KEY(`thesis_id`, `field_id`),
	FOREIGN KEY (`thesis_id`) REFERENCES `theses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_id`) REFERENCES `thesis_fields`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `thesis_field_links_field_idx` ON `thesis_field_links` (`field_id`);--> statement-breakpoint
INSERT INTO `thesis_fields` (`id`, `name`, `lab`, `position`) VALUES
	('lab-skj-big-data-processing', 'Lab SKJ - Big Data Processing', 'Lab SKJ', 1),
	('lab-skj-big-data-architecture', 'Lab SKJ - Big Data Architecture', 'Lab SKJ', 2),
	('lab-skj-smart-city-infrastructures', 'Lab SKJ - Smart City Infrastructures', 'Lab SKJ', 3),
	('lab-skj-intelligent-environment', 'Lab SKJ - Intelligent Environment', 'Lab SKJ', 4),
	('lab-skj-infrastructure-data-center', 'Lab SKJ - Infrastructure Data Center', 'Lab SKJ', 5),
	('lab-skj-security-and-preservation', 'Lab SKJ - Security and Preservation', 'Lab SKJ', 6),
	('lab-skj-cyber-security', 'Lab SKJ - Cyber Security', 'Lab SKJ', 7),
	('lab-skj-distributed-network-system', 'Lab SKJ - Distributed Network & System', 'Lab SKJ', 8),
	('lab-skj-high-speed-network-management', 'Lab SKJ - High Speed Network & Management', 'Lab SKJ', 9),
	('lab-skj-operating-system-architecture', 'Lab SKJ - Operating System & Architecture', 'Lab SKJ', 10),
	('lab-skj-cyber-physical-system', 'Lab SKJ - Cyber Physical System', 'Lab SKJ', 11),
	('lab-skj-cloud-computing', 'Lab SKJ - Cloud Computing', 'Lab SKJ', 12),
	('lab-skj-sistem-komputer-dan-jaringan', 'Lab SKJ (Sistem Komputer dan Jaringan)', 'Lab SKJ', 13),
	('lab-elins-robotics', 'Lab Elins - Robotics', 'Lab Elins', 14),
	('lab-elins-image-processing', 'Lab Elins - Image Processing', 'Lab Elins', 15),
	('lab-elins-industrial-instrumentation', 'Lab Elins - Industrial Instrumentation', 'Lab Elins', 16),
	('lab-elins-sensor-tranduser', 'Lab Elins - Sensor Tranduser', 'Lab Elins', 17),
	('lab-elins-telecommunication', 'Lab Elins - Telecommunication', 'Lab Elins', 18),
	('lab-elins-sensor-network-iot', 'Lab Elins - Sensor Network, IoT', 'Lab Elins', 19),
	('lab-elins-signal-processing', 'Lab Elins - Signal Processing', 'Lab Elins', 20),
	('lab-elins-embedded-system', 'Lab Elins - Embedded system', 'Lab Elins', 21),
	('lab-elins-elektronika-dan-instrumentasi', 'Lab Elins (Elektronika dan Instrumentasi)', 'Lab Elins', 22),
	('lab-ak-pengolahan-citra', 'Lab AK - Pengolahan Citra', 'Lab AK', 23),
	('lab-ak-digital', 'Lab AK - Digital', 'Lab AK', 24),
	('lab-ak-kriptologi', 'Lab AK - Kriptologi', 'Lab AK', 25),
	('lab-ak-verifikasi-dan-validasi', 'Lab AK - Verifikasi dan Validasi', 'Lab AK', 26),
	('lab-ak-sains-komputasional', 'Lab AK - Sains Komputasional', 'Lab AK', 27),
	('lab-ak-metode-formal', 'Lab AK - Metode Formal', 'Lab AK', 28),
	('lab-ak-metode-numerik', 'Lab AK - Metode Numerik', 'Lab AK', 29),
	('lab-ak-grafika-komputer', 'Lab AK - Grafika Komputer', 'Lab AK', 30),
	('lab-ak-algoritma', 'Lab AK - Algoritma', 'Lab AK', 31),
	('lab-ak-pemrograman-parallel', 'Lab AK - Pemrograman Parallel', 'Lab AK', 32),
	('lab-ak-gpu-parallel-computing', 'Lab AK - GPU & Parallel Computing', 'Lab AK', 33),
	('lab-ak-approximation-algorithm', 'Lab AK - Approximation Algorithm', 'Lab AK', 34),
	('lab-ak-kompresi-data', 'Lab AK - Kompresi Data', 'Lab AK', 35),
	('lab-ak-algoritma-dan-komputasi', 'Lab AK (Algoritma dan Komputasi)', 'Lab AK', 36),
	('lab-sc-kecerdasan-komputasional', 'Lab SC - Kecerdasan Komputasional', 'Lab SC', 37),
	('lab-sc-pembelajaran-mesin', 'Lab SC - Pembelajaran Mesin', 'Lab SC', 38),
	('lab-sc-sistem-pendukung-keputusan', 'Lab SC - Sistem Pendukung Keputusan', 'Lab SC', 39),
	('lab-sc-logika-fuzzy', 'Lab SC - Logika Fuzzy', 'Lab SC', 40),
	('lab-sc-sistem-pakar-dan-penalaran-komputer', 'Lab SC - Sistem Pakar dan Penalaran Komputer', 'Lab SC', 41),
	('lab-sc-bioinformatika', 'Lab SC - Bioinformatika', 'Lab SC', 42),
	('lab-sc-nlp', 'Lab SC - NLP', 'Lab SC', 43),
	('lab-sc-computer-vision', 'Lab SC - Computer Vision', 'Lab SC', 44),
	('lab-sc-intelligent-agent', 'Lab SC - Intelligent Agent', 'Lab SC', 45),
	('lab-sc-ai', 'Lab SC - AI', 'Lab SC', 46),
	('lab-sc-sistem-cerdas', 'Lab SC (Sistem Cerdas)', 'Lab SC', 47),
	('lab-rpld-software-models-architectures-and-patterns', 'Lab RPLD - Software models, architectures, and patterns', 'Lab RPLD', 48),
	('lab-rpld-business-process-management-and-modeling', 'Lab RPLD - Business process management and modeling', 'Lab RPLD', 49),
	('lab-rpld-software-engineering-processes-methods-practices-and-tools', 'Lab RPLD - Software engineering processes, methods, practices, and tools', 'Lab RPLD', 50),
	('lab-rpld-code-analysis', 'Lab RPLD - Code analysis', 'Lab RPLD', 51),
	('lab-rpld-human-computer-interactions', 'Lab RPLD - Human computer interactions', 'Lab RPLD', 52),
	('lab-rpld-user-interfaces-and-experiences', 'Lab RPLD - User interfaces and experiences', 'Lab RPLD', 53),
	('lab-rpld-gamification', 'Lab RPLD - Gamification', 'Lab RPLD', 54),
	('lab-rpld-virtual-augmented-reality-and-immersive-technologies', 'Lab RPLD - Virtual/augmented reality and immersive technologies', 'Lab RPLD', 55),
	('lab-rpld-data-models-databases-and-information-retrieval', 'Lab RPLD - Data models, databases, and information retrieval', 'Lab RPLD', 56),
	('lab-rpld-big-data-analysis-and-visualization', 'Lab RPLD - Big data analysis and visualization', 'Lab RPLD', 57),
	('lab-rpld-web-mobile-and-ubiquitous-computing', 'Lab RPLD - Web, mobile, and ubiquitous computing', 'Lab RPLD', 58),
	('lab-rpld-enterprise-systems', 'Lab RPLD - Enterprise systems', 'Lab RPLD', 59),
	('lab-rpld-rekayasa-perangkat-lunak-dan-data', 'Lab RPLD (Rekayasa Perangkat Lunak dan Data)', 'Lab RPLD', 60),
	('lab-rpld-e-government', 'Lab RPLD - e-Government', 'Lab RPLD', 61),
	('lab-rpld-it-project-management', 'Lab RPLD - IT Project Management', 'Lab RPLD', 62),
	('lab-rpld-software-quality-assurance', 'Lab RPLD - Software quality assurance', 'Lab RPLD', 63),
	('lab-elins-pattern-recognition', 'Lab Elins - Pattern Recognition', 'Lab Elins', 64),
	('lab-sc-pattern-recognition', 'Lab SC - Pattern Recognition', 'Lab SC', 65);
--> statement-breakpoint
INSERT INTO `thesis_fields` (`id`, `name`, `lab`, `position`)
	SELECT 'legacy-' || lower(hex(randomblob(8))), trim(`field`), 'Legacy', 0
	FROM `theses`
	WHERE `field` IS NOT NULL AND length(trim(`field`)) > 0
	GROUP BY trim(`field`);
--> statement-breakpoint
INSERT INTO `thesis_field_links` (`thesis_id`, `field_id`)
	SELECT t.`id`, f.`id`
	FROM `theses` t
	INNER JOIN `thesis_fields` f ON f.`name` = trim(t.`field`) AND f.`lab` = 'Legacy';
--> statement-breakpoint
ALTER TABLE `theses` DROP COLUMN `field`;--> statement-breakpoint
