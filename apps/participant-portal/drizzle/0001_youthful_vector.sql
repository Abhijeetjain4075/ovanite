CREATE TABLE `decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` varchar(36) NOT NULL,
	`decision` enum('eligible','not_eligible','selected','rejected') NOT NULL,
	`note` text,
	`decidedBy` int NOT NULL,
	`decidedByRole` varchar(32) NOT NULL,
	`decidedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` varchar(36) NOT NULL,
	`evaluatorId` int NOT NULL,
	`evaluatorRole` varchar(32) NOT NULL,
	`rubricVersion` varchar(64) NOT NULL,
	`scores` json NOT NULL,
	`criterionNotes` json NOT NULL,
	`notes` text,
	`overallScore` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portal_audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` varchar(36),
	`actorId` int,
	`actorRole` varchar(32) NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`fromStatus` varchar(32),
	`toStatus` varchar(32),
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rubric_versions` (
	`version` varchar(64) NOT NULL,
	`status` enum('draft','published','retired') NOT NULL DEFAULT 'draft',
	`criteria` json NOT NULL,
	`createdBy` int NOT NULL,
	`publishedBy` int,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rubric_versions_version` PRIMARY KEY(`version`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` varchar(36) NOT NULL,
	`participantId` int NOT NULL,
	`participantName` varchar(180),
	`participantEmail` varchar(320),
	`country` varchar(120),
	`profileUrl` varchar(2048),
	`projectName` varchar(180),
	`shortDescription` varchar(500),
	`problemSolved` text,
	`category` varchar(100),
	`repositoryUrl` varchar(2048),
	`repositoryKey` varchar(512),
	`liveUrl` varchar(2048),
	`documentationUrl` varchar(2048),
	`demoVideoUrl` varchar(2048),
	`technologyStack` text,
	`projectStatus` varchar(60),
	`draftData` json,
	`declarations` json,
	`termsVersion` varchar(64),
	`termsAcceptedAt` timestamp,
	`status` enum('draft','submitted','terms_accepted','validation','evaluation','eligible','not_eligible','selected','rejected','withdrawn','archived') NOT NULL DEFAULT 'draft',
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `submissions_repository_key_uq` UNIQUE(`repositoryKey`)
);
--> statement-breakpoint
CREATE TABLE `terms_versions` (
	`version` varchar(64) NOT NULL,
	`status` enum('draft','published','retired') NOT NULL DEFAULT 'draft',
	`title` varchar(200) NOT NULL,
	`content` longtext NOT NULL,
	`declarations` json NOT NULL,
	`createdBy` int NOT NULL,
	`publishedBy` int,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `terms_versions_version` PRIMARY KEY(`version`)
);
--> statement-breakpoint
CREATE TABLE `validation_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` varchar(36) NOT NULL,
	`outcome` enum('pass','fail') NOT NULL,
	`checks` json NOT NULL,
	`notes` text,
	`validatorId` int NOT NULL,
	`validatorRole` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `validation_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `withdrawals` (
	`submissionId` varchar(36) NOT NULL,
	`participantId` int NOT NULL,
	`reason` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `withdrawals_submissionId` PRIMARY KEY(`submissionId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `portalRole` enum('participant','owner','editor','viewer') DEFAULT 'participant' NOT NULL;--> statement-breakpoint
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_submissionId_submissions_id_fk` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_decidedBy_users_id_fk` FOREIGN KEY (`decidedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_submissionId_submissions_id_fk` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_evaluatorId_users_id_fk` FOREIGN KEY (`evaluatorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_rubricVersion_rubric_versions_version_fk` FOREIGN KEY (`rubricVersion`) REFERENCES `rubric_versions`(`version`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portal_audit_events` ADD CONSTRAINT `portal_audit_events_submissionId_submissions_id_fk` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portal_audit_events` ADD CONSTRAINT `portal_audit_events_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rubric_versions` ADD CONSTRAINT `rubric_versions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rubric_versions` ADD CONSTRAINT `rubric_versions_publishedBy_users_id_fk` FOREIGN KEY (`publishedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_participantId_users_id_fk` FOREIGN KEY (`participantId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_termsVersion_terms_versions_version_fk` FOREIGN KEY (`termsVersion`) REFERENCES `terms_versions`(`version`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `terms_versions` ADD CONSTRAINT `terms_versions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `terms_versions` ADD CONSTRAINT `terms_versions_publishedBy_users_id_fk` FOREIGN KEY (`publishedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `validation_results` ADD CONSTRAINT `validation_results_submissionId_submissions_id_fk` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `validation_results` ADD CONSTRAINT `validation_results_validatorId_users_id_fk` FOREIGN KEY (`validatorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdrawals` ADD CONSTRAINT `withdrawals_submissionId_submissions_id_fk` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdrawals` ADD CONSTRAINT `withdrawals_participantId_users_id_fk` FOREIGN KEY (`participantId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `decision_submission_idx` ON `decisions` (`submissionId`,`decidedAt`);--> statement-breakpoint
CREATE INDEX `evaluation_submission_idx` ON `evaluations` (`submissionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_submission_idx` ON `portal_audit_events` (`submissionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_actor_idx` ON `portal_audit_events` (`actorId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `rubric_status_idx` ON `rubric_versions` (`status`);--> statement-breakpoint
CREATE INDEX `submissions_participant_idx` ON `submissions` (`participantId`,`status`);--> statement-breakpoint
CREATE INDEX `submissions_status_created_idx` ON `submissions` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `submissions_category_idx` ON `submissions` (`category`);--> statement-breakpoint
CREATE INDEX `terms_status_idx` ON `terms_versions` (`status`);--> statement-breakpoint
CREATE INDEX `validation_submission_idx` ON `validation_results` (`submissionId`,`createdAt`);