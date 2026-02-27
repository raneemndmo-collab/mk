-- Add googleMapsUrl to properties table
ALTER TABLE `properties` ADD COLUMN `googleMapsUrl` text;

-- Add googleMapsUrl to property_submissions table
ALTER TABLE `property_submissions` ADD COLUMN `googleMapsUrl` text;
