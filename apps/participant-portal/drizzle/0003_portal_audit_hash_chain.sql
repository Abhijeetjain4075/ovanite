ALTER TABLE `portal_audit_events` ADD COLUMN `prevHash` varchar(64);--> statement-breakpoint
ALTER TABLE `portal_audit_events` ADD COLUMN `hash` varchar(64);--> statement-breakpoint
CREATE INDEX `audit_hash_idx` ON `portal_audit_events` (`hash`);
