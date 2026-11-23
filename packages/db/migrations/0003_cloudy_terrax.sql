PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `reviews_lecturer_course_idx` ON `reviews` (`lecturer_id`,`course_id`);--> statement-breakpoint
CREATE INDEX `reviews_status_deleted_idx` ON `reviews` (`status`,`deleted_at`);