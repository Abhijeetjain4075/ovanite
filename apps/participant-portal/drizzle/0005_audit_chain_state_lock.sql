CREATE TABLE `portal_audit_chain_state` (
  `id` int NOT NULL,
  `tipHash` varchar(64),
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `portal_audit_chain_state_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
INSERT INTO `portal_audit_chain_state` (`id`, `tipHash`)
SELECT 1, (
  SELECT `hash`
  FROM `portal_audit_events`
  WHERE `hash` IS NOT NULL
  ORDER BY `id` DESC
  LIMIT 1
);
