ALTER TABLE `courses` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `courses_deleted_idx` ON `courses` (`deleted_at`);--> statement-breakpoint
ALTER TABLE `lecturers` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `lecturers_deleted_idx` ON `lecturers` (`deleted_at`);