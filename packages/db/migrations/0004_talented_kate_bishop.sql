-- D1 runs each migration in a transaction, so `PRAGMA foreign_keys=OFF` is a no-op
-- there. `review_likes` references `reviews`, so the child table is backed up and
-- rebuilt around the parent table rebuild instead of blocking the drop.
CREATE TABLE `__backup_review_likes` AS SELECT * FROM `review_likes`;--> statement-breakpoint
DROP TABLE `review_likes`;--> statement-breakpoint
CREATE TABLE `__new_reviews` (
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
	CONSTRAINT "reviews_ratings_range" CHECK("__new_reviews"."clarity" between 1 and 5 and "__new_reviews"."support" between 1 and 5 and "__new_reviews"."organization" between 1 and 5),
	CONSTRAINT "reviews_status_valid" CHECK("__new_reviews"."status" in ('pending', 'published', 'hidden'))
);
--> statement-breakpoint
INSERT INTO `__new_reviews`("id", "lecturer_id", "course_id", "term_label", "author_name", "clarity", "support", "organization", "body", "status", "created_at", "deleted_at") SELECT "id", "lecturer_id", "course_id", "term_label", "author_name", "clarity", "support", "organization", "body", "status", "created_at", "deleted_at" FROM `reviews`;--> statement-breakpoint
DROP TABLE `reviews`;--> statement-breakpoint
ALTER TABLE `__new_reviews` RENAME TO `reviews`;--> statement-breakpoint
CREATE TABLE `review_likes` (
	`review_id` text NOT NULL,
	`browser_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`review_id`, `browser_id`),
	FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `review_likes` (`review_id`, `browser_id`, `created_at`) SELECT `review_id`, `browser_id`, `created_at` FROM `__backup_review_likes`;--> statement-breakpoint
DROP TABLE `__backup_review_likes`;--> statement-breakpoint
CREATE INDEX `reviews_lecturer_course_idx` ON `reviews` (`lecturer_id`,`course_id`);--> statement-breakpoint
CREATE INDEX `reviews_status_deleted_idx` ON `reviews` (`status`,`deleted_at`);
