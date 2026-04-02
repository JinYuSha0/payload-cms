-- Apply schema required by Strapi media/folder import.
-- Safe to run once on a database migrated to 20260227_084506_migrate_strapi_categories_only.

CREATE TABLE IF NOT EXISTS `payload_folders` (
  `id` integer PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `folder_id` integer,
  `updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  `created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  FOREIGN KEY (`folder_id`) REFERENCES `payload_folders`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX IF NOT EXISTS `payload_folders_name_idx` ON `payload_folders` (`name`);
CREATE INDEX IF NOT EXISTS `payload_folders_folder_idx` ON `payload_folders` (`folder_id`);
CREATE INDEX IF NOT EXISTS `payload_folders_updated_at_idx` ON `payload_folders` (`updated_at`);
CREATE INDEX IF NOT EXISTS `payload_folders_created_at_idx` ON `payload_folders` (`created_at`);

CREATE TABLE IF NOT EXISTS `payload_folders_folder_type` (
  `order` integer NOT NULL,
  `parent_id` integer NOT NULL,
  `value` text,
  `id` integer PRIMARY KEY NOT NULL,
  FOREIGN KEY (`parent_id`) REFERENCES `payload_folders`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `payload_folders_folder_type_order_idx` ON `payload_folders_folder_type` (`order`);
CREATE INDEX IF NOT EXISTS `payload_folders_folder_type_parent_idx` ON `payload_folders_folder_type` (`parent_id`);

ALTER TABLE `media` ADD COLUMN `folder_id` integer REFERENCES payload_folders(id);
CREATE INDEX IF NOT EXISTS `media_folder_idx` ON `media` (`folder_id`);

ALTER TABLE `payload_locked_documents_rels` ADD COLUMN `payload_folders_id` integer REFERENCES payload_folders(id);
CREATE INDEX IF NOT EXISTS `payload_locked_documents_rels_payload_folders_id_idx` ON `payload_locked_documents_rels` (`payload_folders_id`);

WITH next_values AS (
  SELECT
    COALESCE(MAX(id), 0) + 1 AS next_id,
    COALESCE(MAX(batch), 0) + 1 AS next_batch
  FROM payload_migrations
)
INSERT INTO payload_migrations (id, name, batch, updated_at, created_at)
SELECT
  next_values.next_id,
  '20260402_035217_add_payload_folders_locked_docs_rel',
  next_values.next_batch,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM next_values
WHERE NOT EXISTS (
  SELECT 1
  FROM payload_migrations
  WHERE name = '20260402_035217_add_payload_folders_locked_docs_rel'
);
