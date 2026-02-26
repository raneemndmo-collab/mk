-- Migration 0018: Admin CRUD enhancements
-- Adds isArchived to buildings/units, audit_log table, unique(buildingId+unitNumber)
-- ADDITIVE ONLY — no destructive changes.

-- ─── Add isArchived to buildings ────────────────────────────────────
ALTER TABLE `buildings` ADD COLUMN IF NOT EXISTS `isArchived` boolean NOT NULL DEFAULT false;

-- ─── Add isArchived to units ────────────────────────────────────────
ALTER TABLE `units` ADD COLUMN IF NOT EXISTS `isArchived` boolean NOT NULL DEFAULT false;

-- ─── Unique constraint: one unit_number per building ────────────────
-- Prevents duplicate apartment numbers within the same building
CREATE UNIQUE INDEX IF NOT EXISTS `uq_building_unitNumber` ON `units` (`buildingId`, `unitNumber`);

-- ─── Audit Log ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int,
  `userName` varchar(255),
  `action` enum('CREATE','UPDATE','ARCHIVE','RESTORE','DELETE','LINK_BEDS24','UNLINK_BEDS24') NOT NULL,
  `entityType` enum('BUILDING','UNIT','BEDS24_MAP','LEDGER','EXTENSION','PAYMENT_METHOD') NOT NULL,
  `entityId` int NOT NULL,
  `entityLabel` varchar(255),
  `changes` json,
  `metadata` json,
  `ipAddress` varchar(45),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_entityType_entityId` (`entityType`, `entityId`),
  INDEX `idx_audit_userId` (`userId`),
  INDEX `idx_audit_createdAt` (`createdAt`)
);
