ALTER TABLE `announcements` ADD `variant` text DEFAULT 'primary' NOT NULL
  CONSTRAINT "announcements_variant" CHECK ("variant" IN ('primary', 'error', 'neutral'));
