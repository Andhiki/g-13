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