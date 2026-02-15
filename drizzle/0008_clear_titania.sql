ALTER TABLE `propertyManagers` ADD `editToken` varchar(64);--> statement-breakpoint
ALTER TABLE `propertyManagers` ADD CONSTRAINT `propertyManagers_editToken_unique` UNIQUE(`editToken`);