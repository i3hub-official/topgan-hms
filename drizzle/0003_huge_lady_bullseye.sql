CREATE TABLE `purchase_order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`item_id` integer NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` real NOT NULL,
	`total_price` real NOT NULL,
	`received_quantity` real DEFAULT 0,
	FOREIGN KEY (`order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `inventory`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`supplier_id` integer NOT NULL,
	`order_date` integer NOT NULL,
	`expected_delivery` integer,
	`actual_delivery` integer,
	`status` text DEFAULT 'pending',
	`total_amount` real DEFAULT 0,
	`notes` text,
	`created_by` text,
	`created_at` integer,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_orders_order_number_unique` ON `purchase_orders` (`order_number`);--> statement-breakpoint
ALTER TABLE `inventory` ADD `supplier_id` integer REFERENCES suppliers(id);--> statement-breakpoint
ALTER TABLE `inventory` ADD `reorder_level` real DEFAULT 10;--> statement-breakpoint
ALTER TABLE `inventory` ADD `reorder_quantity` real DEFAULT 50;--> statement-breakpoint
ALTER TABLE `inventory` ADD `location` text;--> statement-breakpoint
ALTER TABLE `inventory` ADD `last_order_date` integer;