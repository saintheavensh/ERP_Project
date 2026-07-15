CREATE TABLE `payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`icon` text DEFAULT '💳' NOT NULL,
	`enabled` integer DEFAULT true,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `payment_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`method_id` text NOT NULL,
	`name` text NOT NULL,
	`account_number` text,
	`account_holder` text,
	`enabled` integer DEFAULT true,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`method_id`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `sale_payments` ADD `method_id` text REFERENCES payment_methods(id);--> statement-breakpoint
ALTER TABLE `sale_payments` ADD `variant_name` text;--> statement-breakpoint
ALTER TABLE `sale_payments` ADD `variant_id` text REFERENCES payment_variants(id);