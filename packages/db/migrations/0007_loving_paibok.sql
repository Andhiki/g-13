ALTER TABLE `announcements` ADD `variant` text DEFAULT 'primary' NOT NULL
  CONSTRAINT "announcements_variant" CHECK ("variant" IN ('primary', 'error', 'neutral'));
--> statement-breakpoint
ALTER TABLE `announcements` ADD `cta_open_in_new_tab` integer DEFAULT false NOT NULL;
