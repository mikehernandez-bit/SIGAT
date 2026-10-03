CREATE TABLE `simulated_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`gate_owner` text NOT NULL,
	`email` text NOT NULL,
	`kind` text NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`gate_owner`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `simulated_accounts_owner_email_idx` ON `simulated_accounts` (`gate_owner`,`email`);--> statement-breakpoint
CREATE TABLE `simulation_sessions` (
	`gate_owner` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`updated` text NOT NULL,
	FOREIGN KEY (`gate_owner`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor`) REFERENCES `simulated_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
