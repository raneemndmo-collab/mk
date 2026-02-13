CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`tenantId` int NOT NULL,
	`landlordId` int NOT NULL,
	`status` enum('pending','approved','rejected','active','completed','cancelled') NOT NULL DEFAULT 'pending',
	`moveInDate` timestamp NOT NULL,
	`moveOutDate` timestamp NOT NULL,
	`durationMonths` int NOT NULL,
	`monthlyRent` decimal(10,2) NOT NULL,
	`securityDeposit` decimal(10,2),
	`totalAmount` decimal(10,2),
	`leaseTerms` text,
	`leaseTermsAr` text,
	`contractUrl` text,
	`tenantNotes` text,
	`landlordNotes` text,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int,
	`tenantId` int NOT NULL,
	`landlordId` int NOT NULL,
	`lastMessageAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`propertyId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenanceRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`tenantId` int NOT NULL,
	`landlordId` int NOT NULL,
	`bookingId` int,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`description` text NOT NULL,
	`descriptionAr` text,
	`category` enum('plumbing','electrical','hvac','appliance','structural','pest_control','cleaning','other') DEFAULT 'other',
	`priority` enum('low','medium','high','emergency') DEFAULT 'medium',
	`status` enum('submitted','acknowledged','in_progress','completed','cancelled') NOT NULL DEFAULT 'submitted',
	`photos` json,
	`landlordResponse` text,
	`landlordResponseAr` text,
	`estimatedCost` decimal(10,2),
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenanceRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`messageType` enum('text','image','file') DEFAULT 'text',
	`fileUrl` text,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('booking_request','booking_approved','booking_rejected','payment_received','payment_due','message_new','maintenance_update','lease_expiring','system') NOT NULL,
	`titleEn` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`contentEn` text,
	`contentAr` text,
	`relatedId` int,
	`relatedType` varchar(50),
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`tenantId` int NOT NULL,
	`landlordId` int NOT NULL,
	`type` enum('rent','deposit','service_fee','refund') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'SAR',
	`status` enum('pending','processing','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`stripePaymentId` varchar(255),
	`stripeSessionId` varchar(255),
	`description` text,
	`descriptionAr` text,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `platformSettings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`landlordId` int NOT NULL,
	`titleEn` varchar(255) NOT NULL,
	`titleAr` varchar(255) NOT NULL,
	`descriptionEn` text,
	`descriptionAr` text,
	`propertyType` enum('apartment','villa','studio','duplex','furnished_room','compound','hotel_apartment') NOT NULL,
	`status` enum('draft','pending','active','inactive','rejected') NOT NULL DEFAULT 'draft',
	`city` varchar(100),
	`cityAr` varchar(100),
	`district` varchar(100),
	`districtAr` varchar(100),
	`address` text,
	`addressAr` text,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`bedrooms` int DEFAULT 1,
	`bathrooms` int DEFAULT 1,
	`sizeSqm` int,
	`floor` int,
	`totalFloors` int,
	`yearBuilt` int,
	`furnishedLevel` enum('unfurnished','semi_furnished','fully_furnished') DEFAULT 'unfurnished',
	`monthlyRent` decimal(10,2) NOT NULL,
	`securityDeposit` decimal(10,2),
	`amenities` json,
	`utilitiesIncluded` json,
	`houseRules` text,
	`houseRulesAr` text,
	`minStayMonths` int DEFAULT 1,
	`maxStayMonths` int DEFAULT 12,
	`instantBook` boolean DEFAULT false,
	`photos` json,
	`videoUrl` text,
	`virtualTourUrl` text,
	`isVerified` boolean DEFAULT false,
	`isFeatured` boolean DEFAULT false,
	`viewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyAvailability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isBlocked` boolean DEFAULT false,
	`priceOverride` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyAvailability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`tenantId` int NOT NULL,
	`bookingId` int,
	`rating` int NOT NULL,
	`comment` text,
	`commentAr` text,
	`isPublished` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedSearches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255),
	`filters` json,
	`alertEnabled` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedSearches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','landlord','tenant') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `nameAr` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bioAr` text;--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLang` enum('ar','en') DEFAULT 'ar';--> statement-breakpoint
ALTER TABLE `users` ADD `isVerified` boolean DEFAULT false;