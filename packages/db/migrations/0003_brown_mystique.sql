CREATE TABLE `learning_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`title_id` text NOT NULL,
	`title_en` text NOT NULL,
	`description_id` text NOT NULL,
	`description_en` text NOT NULL,
	`url` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "learning_resources_url_scheme" CHECK("learning_resources"."url" like 'https://%')
);
--> statement-breakpoint
CREATE INDEX `learning_resources_visible_idx` ON `learning_resources` (`deleted_at`,`sort_order`);--> statement-breakpoint
-- Seed the five learning resources that used to live in ResourcesPage.tsx, preserving their
-- current order and the copy from packages/i18n/src/locales/{id,en}/resources.json.
INSERT INTO `learning_resources` (`id`, `title_id`, `title_en`, `description_id`, `description_en`, `url`, `sort_order`) VALUES
	('cs50', 'CS50’s Introduction to Computer Science', 'CS50’s Introduction to Computer Science', 'Kami merekomendasikan CS50 sebagai titik awalmu sebagai mahasiswa ilmu komputer. Kamu akan belajar tipe data, struktur data, perulangan, rekursi, API, dan pemecahan masalah. Kamu juga akan merasakan serunya menyalin dan menempel perintah ke terminalmu.', 'We recommend CS50 as your starting point as a computer science student. You’ll learn data types, data structures, loops, recursion, APIs, and problem solving. You’ll also get that amazing feeling of copying and pasting commands into your terminal.', 'https://cs50.harvard.edu/x/', 0),
	('roadmap-sh', 'roadmap.sh', 'roadmap.sh', 'Kami merekomendasikan roadmap.sh kalau kamu belum tahu harus mulai dari mana untuk meniti karier di bidang teknologi. Pilih jalur, lihat apa yang perlu dipelajari, lalu jalani satu langkah demi satu langkah.', 'We recommend roadmap.sh if you have no idea where to start on your way to a career in tech. Pick a path, see what you need to learn, and take it one step at a time.', 'https://roadmap.sh/computer-science', 1),
	('dike-latex-template', 'Template LaTeX Skripsi DIKE UGM', 'DIKE UGM Skripsi LaTeX template', 'Kami menyiapkan template proposal dan skripsi yang langsung bisa kamu pakai. Template ini cocok dipakai bersama coding agent, meski kamu belum pernah menggunakan LaTeX.', 'We made this ready-to-use proposal and skripsi template for you. It works well with coding agents, even if you’ve never used LaTeX.', 'https://github.com/vityasyyy/template-skripsi-dike-ugm', 2),
	('kkn-automation', 'KKN Automation', 'KKN Automation', 'Kami merekomendasikan alat ini buat kamu yang malas (kemungkinan besar kamu) supaya presensi KKN-mu otomatis dan bisa kamu lupakan.', 'We recommend this tool for lazy people (most likely you) who want to automate KKN attendance and forget about it altogether.', 'https://github.com/vityasyyy/kkn-automation-standalone', 3),
	('himakom-exam-archive', 'Arsip ujian HIMAKOM UGM', 'HIMAKOM UGM exam archive', 'Kami sarankan kamu melihat kumpulan soal ujian ini sebelum ujian berikutnya. Cek soal-soal yang pernah keluar dan gunakan sebagai panduan belajar.', 'We recommend checking these past exam papers before your next exam. See what questions came up and use them to guide your study.', 'https://himakom.ugm.ac.id/exam', 4);
