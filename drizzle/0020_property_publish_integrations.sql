-- Migration 0020: Property publish workflow + pricing source + integration configs
-- 1) Update property status enum: add 'published' and 'archived', keep backward compat
ALTER TABLE `properties` MODIFY COLUMN `status` ENUM('draft','pending','active','inactive','rejected','published','archived') NOT NULL DEFAULT 'draft';
--> statement-breakpoint
-- 2) Migrate existing 'active' properties to 'published' so they remain visible
UPDATE `properties` SET `status` = 'published' WHERE `status` = 'active';
--> statement-breakpoint
-- 3) Add pricingSource column to properties
ALTER TABLE `properties` ADD COLUMN `pricingSource` ENUM('PROPERTY','UNIT') NOT NULL DEFAULT 'PROPERTY';
--> statement-breakpoint
-- 4) Add submissionId to properties for tracking converted submissions
ALTER TABLE `properties` ADD COLUMN `submissionId` int DEFAULT NULL;
--> statement-breakpoint
-- 5) Create integration_configs table
CREATE TABLE IF NOT EXISTS `integration_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationKey` varchar(50) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`displayNameAr` varchar(100),
	`isEnabled` boolean NOT NULL DEFAULT false,
	`configJson` text,
	`status` ENUM('not_configured','configured','healthy','failing') NOT NULL DEFAULT 'not_configured',
	`lastTestedAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_configs_key_unique` UNIQUE(`integrationKey`)
);
--> statement-breakpoint
-- 6) Add price snapshot fields to bookings (if not already present)
ALTER TABLE `bookings` ADD COLUMN `fees` decimal(10,2) DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `bookings` ADD COLUMN `vatAmount` decimal(10,2) DEFAULT 0;
--> statement-breakpoint
-- 7) Expand audit_log entityType to include PROPERTY, SUBMISSION, INTEGRATION
ALTER TABLE `audit_log` MODIFY COLUMN `entityType` ENUM('BUILDING','UNIT','BEDS24_MAP','LEDGER','EXTENSION','PAYMENT_METHOD','PROPERTY','SUBMISSION','INTEGRATION') NOT NULL;
--> statement-breakpoint
-- 8) Expand audit_log action to include PUBLISH, UNPUBLISH, CONVERT, TEST, ENABLE, DISABLE
ALTER TABLE `audit_log` MODIFY COLUMN `action` ENUM('CREATE','UPDATE','ARCHIVE','RESTORE','DELETE','LINK_BEDS24','UNLINK_BEDS24','PUBLISH','UNPUBLISH','CONVERT','TEST','ENABLE','DISABLE') NOT NULL;
