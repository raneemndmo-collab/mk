CREATE TABLE `ai_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`extractedText` text,
	`category` varchar(100) DEFAULT 'general',
	`description` text,
	`descriptionAr` text,
	`isActive` boolean DEFAULT true,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_documents_id` PRIMARY KEY(`id`)
);
