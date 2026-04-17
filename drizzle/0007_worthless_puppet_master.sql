CREATE TABLE `inventory_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text DEFAULT '📦',
	`color` text DEFAULT '#64748b',
	`is_active` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`parent_id` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `inventory_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_categories_name_unique` ON `inventory_categories` (`name`);--> statement-breakpoint
ALTER TABLE `inventory` ADD `category_id` integer NOT NULL REFERENCES inventory_categories(id);--> statement-breakpoint
ALTER TABLE `inventory` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `inventory` DROP COLUMN `category`;