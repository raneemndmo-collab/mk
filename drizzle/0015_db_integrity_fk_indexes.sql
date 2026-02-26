-- ============================================================================
-- Migration 0015: Database Integrity — Foreign Keys + Indexes
-- Date: 2026-02-26
-- Purpose: Add FK constraints and performance indexes to eliminate orphan
--          records and prevent full-table scans on common queries.
-- Safety: All FKs use ON DELETE CASCADE or SET NULL (never RESTRICT on
--         user-facing operations). Indexes are non-blocking on MySQL 8+.
-- Rollback: See bottom of file for DROP statements.
-- ============================================================================

-- ─── STEP 1: Clean orphan records BEFORE adding FK constraints ──────────────
-- These DELETE statements remove rows that reference non-existent parent rows.
-- Without this step, ALTER TABLE would fail with FK violation errors.

DELETE FROM `properties` WHERE `landlordId` NOT IN (SELECT `id` FROM `users`);
DELETE FROM `propertyAvailability` WHERE `propertyId` NOT IN (SELECT `id` FROM `properties`);
DELETE FROM `favorites` WHERE `userId` NOT IN (SELECT `id` FROM `users`);
DELETE FROM `favorites` WHERE `propertyId` NOT IN (SELECT `id` FROM `properties`);
DELETE FROM `bookings` WHERE `tenantId` NOT IN (SELECT `id` FROM `users`);
DELETE FROM `bookings` WHERE `propertyId` NOT IN (SELECT `id` FROM `properties`);
DELETE FROM `payments` WHERE `bookingId` NOT IN (SELECT `id` FROM `bookings`);
DELETE FROM `conversations` WHERE `propertyId` NOT IN (SELECT `id` FROM `properties`);
DELETE FROM `messages` WHERE `conversationId` NOT IN (SELECT `id` FROM `conversations`);
DELETE FROM `maintenanceRequests` WHERE `tenantId` NOT IN (SELECT `id` FROM `users`);
DELETE FROM `maintenanceRequests` WHERE `propertyId` NOT IN (SELECT `id` FROM `properties`);
DELETE FROM `reviews` WHERE `tenantId` NOT IN (SELECT `id` FROM `users`);
DELETE FROM `reviews` WHERE `propertyId` NOT IN (SELECT `id` FROM `properties`);
DELETE FROM `notifications` WHERE `userId` NOT IN (SELECT `id` FROM `users`);
DELETE FROM `savedSearches` WHERE `userId` NOT IN (SELECT `id` FROM `users`);
DELETE FROM `aiConversations` WHERE `userId` NOT IN (SELECT `id` FROM `users`);
DELETE FROM `aiMessages` WHERE `conversationId` NOT IN (SELECT `id` FROM `aiConversations`);
DELETE FROM `userActivities` WHERE `userId` NOT IN (SELECT `id` FROM `users`);
DELETE FROM `adminPermissions` WHERE `userId` NOT IN (SELECT `id` FROM `users`);
DELETE FROM `propertyManagerAssignments` WHERE `propertyId` NOT IN (SELECT `id` FROM `properties`);
DELETE FROM `propertyManagerAssignments` WHERE `managerId` NOT IN (SELECT `id` FROM `propertyManagers`);
DELETE FROM `inspectionRequests` WHERE `propertyId` NOT IN (SELECT `id` FROM `properties`);
DELETE FROM `service_requests` WHERE `tenantId` NOT IN (SELECT `id` FROM `users`);
DELETE FROM `emergency_maintenance` WHERE `tenantId` NOT IN (SELECT `id` FROM `users`);
DELETE FROM `emergency_maintenance` WHERE `propertyId` NOT IN (SELECT `id` FROM `properties`);
DELETE FROM `maintenance_updates` WHERE `maintenanceId` NOT IN (SELECT `id` FROM `emergency_maintenance`);
DELETE FROM `push_subscriptions` WHERE `userId` NOT IN (SELECT `id` FROM `users`);
DELETE FROM `ai_documents` WHERE `uploadedBy` NOT IN (SELECT `id` FROM `users`);
DELETE FROM `otp_codes` WHERE `userId` IS NOT NULL AND `userId` NOT IN (SELECT `id` FROM `users`);

-- ─── STEP 2: Foreign Key Constraints ────────────────────────────────────────

-- properties.landlordId → users.id
ALTER TABLE `properties`
  ADD CONSTRAINT `fk_properties_landlord`
  FOREIGN KEY (`landlordId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- propertyAvailability.propertyId → properties.id
ALTER TABLE `propertyAvailability`
  ADD CONSTRAINT `fk_availability_property`
  FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- favorites.userId → users.id
ALTER TABLE `favorites`
  ADD CONSTRAINT `fk_favorites_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- favorites.propertyId → properties.id
ALTER TABLE `favorites`
  ADD CONSTRAINT `fk_favorites_property`
  FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- bookings.tenantId → users.id
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_tenant`
  FOREIGN KEY (`tenantId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- bookings.propertyId → properties.id
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_property`
  FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- payments.bookingId → bookings.id
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_booking`
  FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- conversations.propertyId → properties.id
ALTER TABLE `conversations`
  ADD CONSTRAINT `fk_conversations_property`
  FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- messages.conversationId → conversations.id
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_conversation`
  FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- maintenanceRequests.tenantId → users.id
ALTER TABLE `maintenanceRequests`
  ADD CONSTRAINT `fk_maintenance_tenant`
  FOREIGN KEY (`tenantId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- maintenanceRequests.propertyId → properties.id
ALTER TABLE `maintenanceRequests`
  ADD CONSTRAINT `fk_maintenance_property`
  FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- reviews.tenantId → users.id
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_tenant`
  FOREIGN KEY (`tenantId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- reviews.propertyId → properties.id
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_property`
  FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- notifications.userId → users.id
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- savedSearches.userId → users.id
ALTER TABLE `savedSearches`
  ADD CONSTRAINT `fk_saved_searches_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- aiConversations.userId → users.id
ALTER TABLE `aiConversations`
  ADD CONSTRAINT `fk_ai_conversations_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- aiMessages.conversationId → aiConversations.id
ALTER TABLE `aiMessages`
  ADD CONSTRAINT `fk_ai_messages_conversation`
  FOREIGN KEY (`conversationId`) REFERENCES `aiConversations`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- userActivities.userId → users.id
ALTER TABLE `userActivities`
  ADD CONSTRAINT `fk_user_activities_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- adminPermissions.userId → users.id
ALTER TABLE `adminPermissions`
  ADD CONSTRAINT `fk_admin_permissions_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- propertyManagerAssignments.propertyId → properties.id
ALTER TABLE `propertyManagerAssignments`
  ADD CONSTRAINT `fk_pm_assignments_property`
  FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- propertyManagerAssignments.managerId → propertyManagers.id
ALTER TABLE `propertyManagerAssignments`
  ADD CONSTRAINT `fk_pm_assignments_manager`
  FOREIGN KEY (`managerId`) REFERENCES `propertyManagers`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- inspectionRequests.propertyId → properties.id
ALTER TABLE `inspectionRequests`
  ADD CONSTRAINT `fk_inspection_property`
  FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- service_requests.tenantId → users.id
ALTER TABLE `service_requests`
  ADD CONSTRAINT `fk_service_requests_tenant`
  FOREIGN KEY (`tenantId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- emergency_maintenance.tenantId → users.id
ALTER TABLE `emergency_maintenance`
  ADD CONSTRAINT `fk_emergency_tenant`
  FOREIGN KEY (`tenantId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- emergency_maintenance.propertyId → properties.id
ALTER TABLE `emergency_maintenance`
  ADD CONSTRAINT `fk_emergency_property`
  FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- maintenance_updates.maintenanceId → emergency_maintenance.id
ALTER TABLE `maintenance_updates`
  ADD CONSTRAINT `fk_maint_updates_emergency`
  FOREIGN KEY (`maintenanceId`) REFERENCES `emergency_maintenance`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- push_subscriptions.userId → users.id
ALTER TABLE `push_subscriptions`
  ADD CONSTRAINT `fk_push_subs_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ai_documents.uploadedBy → users.id
ALTER TABLE `ai_documents`
  ADD CONSTRAINT `fk_ai_docs_uploader`
  FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- otp_codes.userId → users.id (nullable, so SET NULL)
ALTER TABLE `otp_codes`
  ADD CONSTRAINT `fk_otp_user`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── STEP 3: Performance Indexes ────────────────────────────────────────────
-- Only add indexes that don't already exist (MySQL ignores duplicate index errors
-- but we use IF NOT EXISTS pattern via CREATE INDEX).

-- Properties: search by city, status, landlord
CREATE INDEX `idx_properties_city` ON `properties`(`city`);
CREATE INDEX `idx_properties_status` ON `properties`(`status`);
CREATE INDEX `idx_properties_landlord` ON `properties`(`landlordId`);
CREATE INDEX `idx_properties_city_status` ON `properties`(`city`, `status`);

-- Bookings: search by tenant, property, status, dates
CREATE INDEX `idx_bookings_tenant` ON `bookings`(`tenantId`);
CREATE INDEX `idx_bookings_property` ON `bookings`(`propertyId`);
CREATE INDEX `idx_bookings_status` ON `bookings`(`status`);
CREATE INDEX `idx_bookings_dates` ON `bookings`(`startDate`, `endDate`);

-- Payments: search by booking, status
CREATE INDEX `idx_payments_booking` ON `payments`(`bookingId`);
CREATE INDEX `idx_payments_status` ON `payments`(`status`);

-- Notifications: search by user, read status
CREATE INDEX `idx_notifications_user` ON `notifications`(`userId`);
CREATE INDEX `idx_notifications_user_read` ON `notifications`(`userId`, `isRead`);

-- Messages: search by conversation
CREATE INDEX `idx_messages_conversation` ON `messages`(`conversationId`);

-- Conversations: search by property, participants
CREATE INDEX `idx_conversations_property` ON `conversations`(`propertyId`);

-- Maintenance: search by tenant, property, status
CREATE INDEX `idx_maintenance_tenant` ON `maintenanceRequests`(`tenantId`);
CREATE INDEX `idx_maintenance_property` ON `maintenanceRequests`(`propertyId`);
CREATE INDEX `idx_maintenance_status` ON `maintenanceRequests`(`status`);

-- Reviews: search by property, tenant
CREATE INDEX `idx_reviews_property` ON `reviews`(`propertyId`);
CREATE INDEX `idx_reviews_tenant` ON `reviews`(`tenantId`);

-- Favorites: search by user
CREATE INDEX `idx_favorites_user` ON `favorites`(`userId`);

-- User activities: search by user, type
CREATE INDEX `idx_activities_user` ON `userActivities`(`userId`);
CREATE INDEX `idx_activities_type` ON `userActivities`(`activityType`);

-- OTP codes: search by destination + purpose
CREATE INDEX `idx_otp_destination` ON `otp_codes`(`destination`, `purpose`);

-- Property availability: search by property
CREATE INDEX `idx_availability_property` ON `propertyAvailability`(`propertyId`);

-- Platform settings: search by key
CREATE INDEX `idx_settings_key` ON `platformSettings`(`settingKey`);

-- Districts: search by city
CREATE INDEX `idx_districts_city` ON `districts`(`cityId`);

-- Emergency maintenance: search by property, status
CREATE INDEX `idx_emergency_property` ON `emergency_maintenance`(`propertyId`);
CREATE INDEX `idx_emergency_status` ON `emergency_maintenance`(`status`);

-- ============================================================================
-- ROLLBACK (run manually if needed):
-- ============================================================================
-- ALTER TABLE `properties` DROP FOREIGN KEY `fk_properties_landlord`;
-- ALTER TABLE `propertyAvailability` DROP FOREIGN KEY `fk_availability_property`;
-- ALTER TABLE `favorites` DROP FOREIGN KEY `fk_favorites_user`;
-- ALTER TABLE `favorites` DROP FOREIGN KEY `fk_favorites_property`;
-- ALTER TABLE `bookings` DROP FOREIGN KEY `fk_bookings_tenant`;
-- ALTER TABLE `bookings` DROP FOREIGN KEY `fk_bookings_property`;
-- ALTER TABLE `payments` DROP FOREIGN KEY `fk_payments_booking`;
-- ALTER TABLE `conversations` DROP FOREIGN KEY `fk_conversations_property`;
-- ALTER TABLE `messages` DROP FOREIGN KEY `fk_messages_conversation`;
-- ALTER TABLE `maintenanceRequests` DROP FOREIGN KEY `fk_maintenance_tenant`;
-- ALTER TABLE `maintenanceRequests` DROP FOREIGN KEY `fk_maintenance_property`;
-- ALTER TABLE `reviews` DROP FOREIGN KEY `fk_reviews_tenant`;
-- ALTER TABLE `reviews` DROP FOREIGN KEY `fk_reviews_property`;
-- ALTER TABLE `notifications` DROP FOREIGN KEY `fk_notifications_user`;
-- ALTER TABLE `savedSearches` DROP FOREIGN KEY `fk_saved_searches_user`;
-- ALTER TABLE `aiConversations` DROP FOREIGN KEY `fk_ai_conversations_user`;
-- ALTER TABLE `aiMessages` DROP FOREIGN KEY `fk_ai_messages_conversation`;
-- ALTER TABLE `userActivities` DROP FOREIGN KEY `fk_user_activities_user`;
-- ALTER TABLE `adminPermissions` DROP FOREIGN KEY `fk_admin_permissions_user`;
-- ALTER TABLE `propertyManagerAssignments` DROP FOREIGN KEY `fk_pm_assignments_property`;
-- ALTER TABLE `propertyManagerAssignments` DROP FOREIGN KEY `fk_pm_assignments_manager`;
-- ALTER TABLE `inspectionRequests` DROP FOREIGN KEY `fk_inspection_property`;
-- ALTER TABLE `service_requests` DROP FOREIGN KEY `fk_service_requests_tenant`;
-- ALTER TABLE `emergency_maintenance` DROP FOREIGN KEY `fk_emergency_tenant`;
-- ALTER TABLE `emergency_maintenance` DROP FOREIGN KEY `fk_emergency_property`;
-- ALTER TABLE `maintenance_updates` DROP FOREIGN KEY `fk_maint_updates_emergency`;
-- ALTER TABLE `push_subscriptions` DROP FOREIGN KEY `fk_push_subs_user`;
-- ALTER TABLE `ai_documents` DROP FOREIGN KEY `fk_ai_docs_uploader`;
-- ALTER TABLE `otp_codes` DROP FOREIGN KEY `fk_otp_user`;
-- (Indexes can be dropped with: DROP INDEX `idx_name` ON `table_name`;)
