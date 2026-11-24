CREATE TABLE `auth_account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `auth_account_user_idx` ON `auth_account` (`user_id`);--> statement-breakpoint
CREATE TABLE `auth_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_session` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_session_token_unique` ON `auth_session` (`token`);--> statement-breakpoint
CREATE INDEX `auth_session_user_idx` ON `auth_session` (`user_id`);--> statement-breakpoint
CREATE TABLE `auth_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_user_email_unique` ON `auth_user` (`email`);--> statement-breakpoint
CREATE TABLE `auth_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_verification_identifier_idx` ON `auth_verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name_id` text NOT NULL,
	`name_en` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `review_likes` (
	`review_id` text NOT NULL,
	`browser_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`review_id`, `browser_id`),
	FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `review_submission_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`lecturer_id` text NOT NULL,
	`course_id` text NOT NULL,
	`term_label` text NOT NULL,
	`author_name` text NOT NULL,
	`clarity` integer NOT NULL,
	`support` integer NOT NULL,
	`organization` integer NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "reviews_ratings_range" CHECK("reviews"."clarity" between 1 and 5 and "reviews"."support" between 1 and 5 and "reviews"."organization" between 1 and 5),
	CONSTRAINT "reviews_status_valid" CHECK("reviews"."status" in ('published', 'hidden'))
);
--> statement-breakpoint
CREATE INDEX `reviews_lecturer_course_idx` ON `reviews` (`lecturer_id`,`course_id`);--> statement-breakpoint
CREATE INDEX `reviews_status_deleted_idx` ON `reviews` (`status`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `lecturers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notification_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`actor_id` text,
	`payload` text DEFAULT '{}' NOT NULL,
	`dedupe_key` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `notification_events_resource_idx` ON `notification_events` (`resource_type`,`resource_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `notification_events_dedupe_key_unique` ON `notification_events` (`dedupe_key`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`read_at` integer,
	`archived_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `notification_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_inbox_idx` ON `notifications` (`recipient_id`,`archived_at`,`read_at`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_event_recipient_unique` ON `notifications` (`event_id`,`recipient_id`);

--> statement-breakpoint
-- Reference data: DIKE UGM faculty directory, https://dcse.fmipa.ugm.ac.id/dosen/ (reviewed 2026-11-20).
INSERT INTO lecturers (id, name) VALUES
  ('abdul-rouf', 'Abdul Ro’uf'),
  ('afiahayati', 'Afiahayati'),
  ('agfianto-eko-putro', 'Agfianto Eko Putra'),
  ('agus-harjoko', 'Agus Harjoko'),
  ('agus-sihabuddin', 'Agus Sihabuddin'),
  ('ahmad-ashari', 'Ahmad Ashari'),
  ('aina-musdholifah', 'Aina Musdholifah'),
  ('andi-dharmawan', 'Andi Dharmawan'),
  ('arif-nurwidyantoro', 'Arif Nurwidyantoro'),
  ('aufaclav-z-k-frisky', 'Aufaclav Zatu Kusuma Frisky'),
  ('azhari', 'Azhari'),
  ('bakhtiar-alldino', 'Bakhtiar Alldino Ardi Sumbodo'),
  ('bambang-n-prastowo', 'Bambang Nurcahyo Prastowo'),
  ('catur-atmaji', 'Catur Atmaji'),
  ('danang-lelono', 'Danang Lelono'),
  ('diyah-utami-k-p', 'Diyah Utami Kusumaning Putri'),
  ('dyah-aruming-tyas', 'Dyah Aruming Tyas'),
  ('dzikri-rahadian-fudholi', 'Dzikri Rahadian Fudholi'),
  ('edi-winarko', 'Edi Winarko'),
  ('erwin-eko-wahyudi', 'Erwin Eko Wahyudi'),
  ('faizah', 'Faizah'),
  ('faizal-makhrus', 'Faizal Makhrus'),
  ('guntur-budi-herwanto', 'Guntur Budi Herwanto'),
  ('i-gede-mujiyatna', 'I Gede Mujiyatna'),
  ('ika-candradewi', 'Ika Candradewi'),
  ('isna-alfi-bustoni', 'Isna Alfi Bustoni'),
  ('janoe-hendarto', 'Janoe Hendarto'),
  ('jazi-eko-istiyanto', 'Jazi Eko Istiyanto'),
  ('kabul-kurniawan', 'Kabul Kurniawan'),
  ('khabib-mustofa', 'Khabib Mustofa'),
  ('lukman-awaludin', 'Lukman Awaludin'),
  ('lukman-heryawan', 'Lukman Heryawan'),
  ('m-alfian-amrizal', 'Muhammad Alfian Amrizal'),
  ('m-auzan', 'Muhammad Auzan'),
  ('m-edi-wibowo', 'Moh. Edi Wibowo'),
  ('m-husni-santriaji', 'Muhammad Husni Santriaji'),
  ('m-idham-a-timur', 'Muhammad Idham Ananta Timur'),
  ('m-oriza-nurfajri', 'Muhammad Oriza Nurfajri'),
  ('m-ridho-fuadin', 'M. Ridho Fuadin'),
  ('mardhani-riasetiawan', 'Mardhani Riasetiawan'),
  ('medi', 'Medi'),
  ('n-a-sulistyo-putro', 'Nur Achmad Sulistyo Putro'),
  ('nia-gella-augoestien', 'Nia Gella Augoestien'),
  ('novera-istiqomah', 'Novera Istiqomah'),
  ('nur-rokhman', 'Nur Rokhman'),
  ('oskar-natan', 'Oskar Natan'),
  ('raden-sumiharto', 'Raden Sumiharto'),
  ('reza-pulungan', 'Mhd. Reza M. I. Pulungan'),
  ('rifki-afina-putri', 'Rifki Afina Putri'),
  ('roghib-m-hujja', 'Roghib Muhammad Hujja'),
  ('sigit-priyanta', 'Sigit Priyanta'),
  ('sri-hartati', 'Sri Hartati'),
  ('sri-mulyana', 'Sri Mulyana'),
  ('suprapto', 'Suprapto'),
  ('tri-kuntoro-p', 'Tri Kuntoro Priyambodo'),
  ('tri-wahyu-supardi', 'Tri Wahyu Supardi'),
  ('triyogatama-w-widodo', 'Triyogatama Wahyu Widodo'),
  ('wahyono', 'Wahyono'),
  ('yohanes-suyanto', 'Yohanes Suyanto'),
  ('yunita-sari', 'Yunita Sari'),
  ('zandy-yudha-perwira', 'Zandy Yudha Perwira')
ON CONFLICT (id) DO UPDATE SET name = excluded.name;

--> statement-breakpoint
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
