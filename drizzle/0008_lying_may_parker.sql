PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_name` text NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL,
	`supplier_id` integer,
	`cost_price` real DEFAULT 0,
	`selling_price` real DEFAULT 0,
	`opening_stock` real DEFAULT 0,
	`additions` real DEFAULT 0,
	`sales` real DEFAULT 0,
	`closing_stock` real DEFAULT 0,
	`physical_count` real,
	`variance` real,
	`reorder_level` real DEFAULT 10,
	`reorder_quantity` real DEFAULT 50,
	`location` text,
	`last_order_date` integer,
	`date` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_inventory`("id", "item_name", "category", "unit", "supplier_id", "cost_price", "selling_price", "opening_stock", "additions", "sales", "closing_stock", "physical_count", "variance", "reorder_level", "reorder_quantity", "location", "last_order_date", "date", "created_at") SELECT "id", "item_name", "category", "unit", "supplier_id", "cost_price", "selling_price", "opening_stock", "additions", "sales", "closing_stock", "physical_count", "variance", "reorder_level", "reorder_quantity", "location", "last_order_date", "date", "created_at" FROM `inventory`;--> statement-breakpoint
DROP TABLE `inventory`;--> statement-breakpoint
ALTER TABLE `__new_inventory` RENAME TO `inventory`;--> statement-breakpoint
PRAGMA foreign_keys=ON;