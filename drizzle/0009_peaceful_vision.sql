CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`item_name` text NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL,
	`opening_stock` real NOT NULL,
	`current_stock` real NOT NULL,
	`reorder_level` real DEFAULT 5,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text,
	`type` text NOT NULL,
	`quantity` real NOT NULL,
	`physical_count` real,
	`variance` real,
	`recorded_by` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP TABLE `account`;--> statement-breakpoint
DROP TABLE `audit_trail`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
DROP TABLE `inventory`;--> statement-breakpoint
DROP TABLE `inventory_categories`;--> statement-breakpoint
DROP TABLE `inventory_movements`;--> statement-breakpoint
DROP TABLE `inventory_units`;--> statement-breakpoint
DROP TABLE `login_history`;--> statement-breakpoint
DROP TABLE `purchase_order_items`;--> statement-breakpoint
DROP TABLE `purchase_orders`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
DROP TABLE `staff_activity`;--> statement-breakpoint
DROP TABLE `staff_details`;--> statement-breakpoint
DROP TABLE `staff_roles`;--> statement-breakpoint
DROP TABLE `store_sections`;--> statement-breakpoint
DROP TABLE `suppliers`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
DROP TABLE `verification`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`audit_date` integer NOT NULL,
	`physical_count` integer NOT NULL,
	`system_count` integer NOT NULL,
	`discrepancy` integer NOT NULL,
	`flagged` text,
	`audited_by` text NOT NULL,
	`notes` text,
	`created_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_audit_logs`("id", "audit_date", "physical_count", "system_count", "discrepancy", "flagged", "audited_by", "notes", "created_at") SELECT "id", "audit_date", "physical_count", "system_count", "discrepancy", "flagged", "audited_by", "notes", "created_at" FROM `audit_logs`;--> statement-breakpoint
DROP TABLE `audit_logs`;--> statement-breakpoint
ALTER TABLE `__new_audit_logs` RENAME TO `audit_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_power_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`generator_id` text DEFAULT 'GEN-01' NOT NULL,
	`start_time` integer NOT NULL,
	`stop_time` integer,
	`fuel_at_start` real,
	`fuel_at_stop` real,
	`fuel_consumed` real,
	`hours_run` real,
	`liters_per_hour` real,
	`flagged` text,
	`recorded_by` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_power_logs`("id", "generator_id", "start_time", "stop_time", "fuel_at_start", "fuel_at_stop", "fuel_consumed", "hours_run", "liters_per_hour", "flagged", "recorded_by", "created_at") SELECT "id", "generator_id", "start_time", "stop_time", "fuel_at_start", "fuel_at_stop", "fuel_consumed", "hours_run", "liters_per_hour", "flagged", "recorded_by", "created_at" FROM `power_logs`;--> statement-breakpoint
DROP TABLE `power_logs`;--> statement-breakpoint
ALTER TABLE `__new_power_logs` RENAME TO `power_logs`;--> statement-breakpoint
CREATE TABLE `__new_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`room_number` text NOT NULL,
	`status` text DEFAULT 'vacant' NOT NULL,
	`rate_per_night` real NOT NULL,
	`last_cleaned` integer,
	`floor` integer DEFAULT 1 NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_rooms`("id", "room_number", "status", "rate_per_night", "last_cleaned", "floor", "updated_at") SELECT "id", "room_number", "status", "rate_per_night", "last_cleaned", "floor", "updated_at" FROM `rooms`;--> statement-breakpoint
DROP TABLE `rooms`;--> statement-breakpoint
ALTER TABLE `__new_rooms` RENAME TO `rooms`;--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_room_number_unique` ON `rooms` (`room_number`);--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text,
	`guest_name` text NOT NULL,
	`amount_paid` real NOT NULL,
	`payment_method` text NOT NULL,
	`check_in` integer NOT NULL,
	`check_out` integer,
	`receipt_number` text,
	`created_by` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "room_id", "guest_name", "amount_paid", "payment_method", "check_in", "check_out", "receipt_number", "created_by", "created_at") SELECT "id", "room_id", "guest_name", "amount_paid", "payment_method", "check_in", "check_out", "receipt_number", "created_by", "created_at" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_receipt_number_unique` ON `transactions` (`receipt_number`);