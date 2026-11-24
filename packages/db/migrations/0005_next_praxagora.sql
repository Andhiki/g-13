CREATE TABLE `theses` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`abstract` text,
	`abstract_en` text,
	`author_name` text NOT NULL,
	`author_batch` integer,
	`year` integer NOT NULL,
	`type` text DEFAULT 'skripsi' NOT NULL,
	`field` text,
	`language` text DEFAULT 'id' NOT NULL,
	`repository_url` text,
	`contact_channel` text,
	`contact_value` text,
	`abstract_public` integer DEFAULT false NOT NULL,
	`contact_public` integer DEFAULT false NOT NULL,
	`consent_at` integer,
	`consent_source` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "theses_title_not_empty" CHECK(length(trim("theses"."title")) > 0),
	CONSTRAINT "theses_author_name_not_empty" CHECK(length(trim("theses"."author_name")) > 0),
	CONSTRAINT "theses_year_range" CHECK("theses"."year" between 1945 and 2100),
	CONSTRAINT "theses_author_batch_range" CHECK("theses"."author_batch" is null or "theses"."author_batch" between 1945 and 2100),
	CONSTRAINT "theses_type_valid" CHECK("theses"."type" in ('skripsi', 'product-innovation', 'collaborative-project', 'industry-project', 'scientific-publication')),
	CONSTRAINT "theses_language_valid" CHECK("theses"."language" in ('id', 'en')),
	CONSTRAINT "theses_status_valid" CHECK("theses"."status" in ('draft', 'published', 'hidden')),
	CONSTRAINT "theses_contact_channel_valid" CHECK("theses"."contact_channel" is null or "theses"."contact_channel" in ('email', 'url')),
	CONSTRAINT "theses_abstract_public_content" CHECK("theses"."abstract_public" = 0 or ("theses"."abstract" is not null and length(trim("theses"."abstract")) > 0)),
	CONSTRAINT "theses_contact_public_content" CHECK("theses"."contact_public" = 0 or ("theses"."contact_channel" is not null and "theses"."contact_value" is not null and length(trim("theses"."contact_value")) > 0)),
	CONSTRAINT "theses_consent_required" CHECK(("theses"."abstract_public" = 0 and "theses"."contact_public" = 0) or "theses"."consent_at" is not null),
	CONSTRAINT "theses_published_consent" CHECK("theses"."status" != 'published' or ("theses"."consent_at" is not null and "theses"."consent_source" is not null))
);
--> statement-breakpoint
CREATE INDEX `theses_status_deleted_year_idx` ON `theses` (`status`,`deleted_at`,`year`);--> statement-breakpoint
CREATE TABLE `thesis_keywords` (
	`thesis_id` text NOT NULL,
	`keyword` text NOT NULL,
	PRIMARY KEY(`thesis_id`, `keyword`),
	FOREIGN KEY (`thesis_id`) REFERENCES `theses`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "thesis_keywords_not_empty" CHECK(length(trim("thesis_keywords"."keyword")) > 0)
);
--> statement-breakpoint
CREATE INDEX `thesis_keywords_keyword_idx` ON `thesis_keywords` (`keyword`);--> statement-breakpoint
CREATE TABLE `thesis_supervisors` (
	`thesis_id` text NOT NULL,
	`position` integer NOT NULL,
	`lecturer_id` text,
	`name` text NOT NULL,
	`role` text,
	PRIMARY KEY(`thesis_id`, `position`),
	FOREIGN KEY (`thesis_id`) REFERENCES `theses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "thesis_supervisors_position_valid" CHECK("thesis_supervisors"."position" >= 0),
	CONSTRAINT "thesis_supervisors_name_not_empty" CHECK(length(trim("thesis_supervisors"."name")) > 0),
	CONSTRAINT "thesis_supervisors_role_valid" CHECK("thesis_supervisors"."role" is null or "thesis_supervisors"."role" in ('main', 'co'))
);
--> statement-breakpoint
CREATE INDEX `thesis_supervisors_lecturer_idx` ON `thesis_supervisors` (`lecturer_id`);