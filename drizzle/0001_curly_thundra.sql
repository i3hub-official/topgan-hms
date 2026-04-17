CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_trail` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`old_values` text,
	`new_values` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `login_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`login_time` integer,
	`ip_address` text,
	`user_agent` text,
	`success` integer DEFAULT true,
	`failure_reason` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `staff_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`check_in` integer,
	`check_out` integer,
	`shift_type` text,
	`hours_worked` integer,
	`location` text,
	`notes` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `staff_details` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`address` text,
	`next_of_kin_name` text,
	`next_of_kin_phone` text,
	`bank_name` text,
	`account_number` text,
	`account_name` text,
	`salary` real,
	`date_joined` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `staff_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`role_name` text NOT NULL,
	`permissions` text,
	`level` integer DEFAULT 1,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_roles_role_name_unique` ON `staff_roles` (`role_name`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`contact_person` text,
	`phone` text NOT NULL,
	`email` text,
	`category` text,
	`address` text,
	`is_active` integer DEFAULT true,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`role` text DEFAULT 'staff',
	`staff_id` text,
	`phone` text,
	`department` text,
	`is_active` integer DEFAULT true,
	`last_login` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_staff_id_unique` ON `user` (`staff_id`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
DROP TABLE `verifications`;--> statement-breakpoint
ALTER TABLE `rooms` ADD `is_active` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `rooms` ADD `deleted_at` integer;