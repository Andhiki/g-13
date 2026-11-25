DROP INDEX `announcements_slug_unique`;--> statement-breakpoint
ALTER TABLE `announcements` ADD `countdown_at` integer;--> statement-breakpoint
ALTER TABLE `announcements` DROP COLUMN `slug`;