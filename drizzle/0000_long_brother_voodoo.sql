CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`audit_date` integer NOT NULL,
	`physical_occupancy` integer NOT NULL,
	`system_bookings` integer NOT NULL,
	`discrepancy` integer NOT NULL,
	`flags` text,
	`total_cash` real,
	`total_pos` real,
	`total_transfer` real,
	`notes` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_name` text NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL,
	`opening_stock` real DEFAULT 0,
	`additions` real DEFAULT 0,
	`sales` real DEFAULT 0,
	`closing_stock` real DEFAULT 0,
	`physical_count` real,
	`variance` real,
	`date` integer NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer,
	`type` text NOT NULL,
	`quantity` real NOT NULL,
	`reason` text,
	`created_at` integer,
	FOREIGN KEY (`item_id`) REFERENCES `inventory`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `power_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`generator_start` integer NOT NULL,
	`generator_stop` integer NOT NULL,
	`fuel_level_start` real NOT NULL,
	`fuel_level_end` real NOT NULL,
	`fuel_consumed` real NOT NULL,
	`hours_run` real NOT NULL,
	`efficiency` real,
	`flagged` integer DEFAULT 0,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_number` text NOT NULL,
	`status` text DEFAULT 'vacant' NOT NULL,
	`rate` real NOT NULL,
	`last_cleaned` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_room_number_unique` ON `rooms` (`room_number`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` integer,
	`guest_name` text NOT NULL,
	`amount` real NOT NULL,
	`payment_method` text NOT NULL,
	`check_in` integer NOT NULL,
	`check_out` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'auditor',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer
);
