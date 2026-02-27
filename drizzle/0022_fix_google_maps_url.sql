-- Fix: Migration 0021 was missing --> statement-breakpoint separators
-- Re-add googleMapsUrl columns using plain ALTER TABLE
ALTER TABLE `properties` ADD COLUMN `googleMapsUrl` text;
--> statement-breakpoint
ALTER TABLE `property_submissions` ADD COLUMN `googleMapsUrl` text;
