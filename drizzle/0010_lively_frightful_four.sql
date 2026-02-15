CREATE TABLE `emergency_maintenance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`bookingId` int,
	`propertyId` int NOT NULL,
	`urgency` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`category` enum('plumbing','electrical','ac_heating','appliance','structural','pest','security','other') NOT NULL DEFAULT 'other',
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`description` text NOT NULL,
	`descriptionAr` text,
	`imageUrls` json,
	`status` enum('open','assigned','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`assignedTo` varchar(255),
	`assignedPhone` varchar(20),
	`resolution` text,
	`resolutionAr` text,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emergency_maintenance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_updates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`maintenanceId` int NOT NULL,
	`message` text NOT NULL,
	`messageAr` text,
	`updatedBy` varchar(255) NOT NULL,
	`newStatus` enum('open','assigned','in_progress','resolved','closed'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `maintenance_updates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nameAr` varchar(255) NOT NULL,
	`nameEn` varchar(255) NOT NULL,
	`descriptionAr` text,
	`descriptionEn` text,
	`price` decimal(10,2) NOT NULL,
	`category` enum('cleaning','maintenance','furniture','moving','other') NOT NULL DEFAULT 'other',
	`icon` varchar(50) DEFAULT 'Wrench',
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platform_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`tenantId` int NOT NULL,
	`bookingId` int,
	`propertyId` int,
	`status` enum('pending','approved','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`notes` text,
	`adminNotes` text,
	`totalPrice` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_requests_id` PRIMARY KEY(`id`)
);
