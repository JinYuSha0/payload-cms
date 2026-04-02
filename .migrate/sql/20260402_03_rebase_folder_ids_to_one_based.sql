-- Fix Payload folders navigation issue caused by folder id = 0.
-- Payload 3.77 folder query logic treats folderID in truthy checks, so 0 is ignored.
-- This script rebases folder IDs from 0-based to 1-based while preserving relations.
-- Safe to run repeatedly (idempotent).

PRAGMA foreign_keys = OFF;

-- Phase 1: move IDs to a temporary high range to avoid PK collisions.
UPDATE payload_folders
SET id = id + 1000
WHERE EXISTS (SELECT 1 FROM payload_folders WHERE id = 0);

UPDATE payload_folders
SET folder_id = folder_id + 1000
WHERE folder_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM payload_folders WHERE id >= 1000);

UPDATE payload_folders_folder_type
SET id = id + 1000
WHERE EXISTS (SELECT 1 FROM payload_folders WHERE id >= 1000);

UPDATE payload_folders_folder_type
SET parent_id = parent_id + 1000
WHERE EXISTS (SELECT 1 FROM payload_folders_folder_type WHERE id >= 1000);

UPDATE media
SET folder_id = folder_id + 1000
WHERE folder_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM payload_folders_folder_type WHERE id >= 1000);

UPDATE payload_locked_documents_rels
SET payload_folders_id = payload_folders_id + 1000
WHERE payload_folders_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM payload_folders_folder_type WHERE id >= 1000);

-- Phase 2: rebase to 1-based IDs.
UPDATE payload_folders
SET id = id - 999
WHERE EXISTS (SELECT 1 FROM payload_folders_folder_type WHERE id >= 1000);

UPDATE payload_folders
SET folder_id = folder_id - 999
WHERE folder_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM payload_folders_folder_type WHERE id >= 1000);

UPDATE media
SET folder_id = folder_id - 999
WHERE folder_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM payload_folders_folder_type WHERE id >= 1000);

UPDATE payload_locked_documents_rels
SET payload_folders_id = payload_folders_id - 999
WHERE payload_folders_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM payload_folders_folder_type WHERE id >= 1000);

UPDATE payload_folders_folder_type
SET parent_id = parent_id - 999
WHERE EXISTS (SELECT 1 FROM payload_folders_folder_type WHERE id >= 1000);

UPDATE payload_folders_folder_type
SET id = id - 999
WHERE EXISTS (SELECT 1 FROM payload_folders_folder_type WHERE id >= 1000);

PRAGMA foreign_keys = ON;
