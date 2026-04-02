-- Generated from Strapi CSV data under .migrate/rds_data
-- Scope: categories + leaf_categories only
-- Source counts: 5 categories, 12 leaf_categories, 17 total category nodes
-- Notes:
-- 1) IDs are remapped to 1-based contiguous integers.
-- 2) Only valid picture relations found in current CSV snapshot are imported.
--    (e.g. related_id 283 -> new category id 16 -> file_id 172 -> media.id 70)
-- 3) Category import does not hard-require media rows to exist; picture is patched later if available.
-- 4) Intentionally no explicit BEGIN/COMMIT for Cloudflare SQL execution compatibility.

-- 1) Upsert category tree into Payload `categories`
INSERT INTO categories (
  id,
  category_id,
  sort_order,
  updated_at,
  created_at,
  _status
)
VALUES
  (1, NULL, 0, '2025-11-12T06:21:35.881Z', '2025-11-12T06:21:35.881Z', 'published'),
  (2, 1, 0, '2025-11-12T06:33:28.816Z', '2025-11-12T06:33:28.816Z', 'published'),
  (3, 2, 0, '2025-11-12T06:34:02.328Z', '2025-11-12T06:34:02.328Z', 'published'),
  (4, 1, 0, '2025-11-13T03:17:42.199Z', '2025-11-13T03:17:42.199Z', 'published'),
  (5, 1, 0, '2025-11-14T02:04:43.728Z', '2025-11-14T02:04:43.728Z', 'published'),
  (6, 3, 0, '2025-11-12T06:39:33.270Z', '2025-11-12T06:35:05.536Z', 'published'),
  (7, 3, 0, '2025-11-12T06:35:55.352Z', '2025-11-12T06:35:55.352Z', 'published'),
  (8, 3, 0, '2025-11-12T06:38:52.179Z', '2025-11-12T06:36:28.982Z', 'published'),
  (9, 3, 0, '2025-11-12T06:39:02.133Z', '2025-11-12T06:37:45.443Z', 'published'),
  (10, 1, 0, '2025-11-12T06:40:22.801Z', '2025-11-12T06:40:22.801Z', 'published'),
  (11, 2, 0, '2025-11-13T03:12:43.925Z', '2025-11-13T03:12:43.925Z', 'published'),
  (12, 4, 0, '2025-11-13T03:18:11.185Z', '2025-11-13T03:18:11.185Z', 'published'),
  (13, 4, 0, '2025-11-13T03:18:31.916Z', '2025-11-13T03:18:31.916Z', 'published'),
  (14, 1, 0, '2025-11-13T04:08:24.094Z', '2025-11-13T04:08:24.094Z', 'published'),
  (15, 5, 0, '2025-11-14T02:05:23.825Z', '2025-11-14T02:05:23.825Z', 'published'),
  (16, 1, 0, '2025-11-15T02:25:01.389Z', '2025-11-15T02:25:01.389Z', 'published'),
  (17, 1, 1, '2025-11-17T23:35:56.229Z', '2025-11-17T23:33:39.155Z', 'published')
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  updated_at = excluded.updated_at,
  created_at = excluded.created_at,
  _status = excluded._status;

-- 2) Upsert localized fields into `categories_locales` (only en exists in source CSV)
INSERT INTO categories_locales (
  name,
  picture_id,
  id,
  _locale,
  _parent_id
)
VALUES
  ('Cooking Equipment', NULL, 1, 'en', 1),
  ('Coffee and Chocolate', NULL, 2, 'en', 2),
  ('Chocolate Machines', NULL, 3, 'en', 3),
  ('Commercial Module', NULL, 4, 'en', 4),
  ('Donut Machine', NULL, 5, 'en', 5),
  ('Chocolate Fountain Machine', NULL, 6, 'en', 6),
  ('Chocolate Coating Machine', NULL, 7, 'en', 7),
  ('Chocolate Filling Machine', NULL, 8, 'en', 8),
  ('Chocolate Heat Preservation Machine', NULL, 9, 'en', 9),
  ('Chicken Rotisserie Ovens ', NULL, 10, 'en', 10),
  ('Coffee Machine', NULL, 11, 'en', 11),
  ('900 Series', NULL, 12, 'en', 12),
  ('700 Series', NULL, 13, 'en', 13),
  ('Commercial Griddles', NULL, 14, 'en', 14),
  ('Donut Robot', NULL, 15, 'en', 15),
  ('Candy Floss Machines', NULL, 16, 'en', 16),
  ('Commercial Combination Oven', NULL, 17, 'en', 17)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  picture_id = excluded.picture_id,
  _locale = excluded._locale,
  _parent_id = excluded._parent_id;

-- 3) Patch known picture relation when corresponding media has been imported.
UPDATE categories_locales
SET picture_id = 70
WHERE _parent_id = 16
  AND _locale = 'en'
  AND EXISTS (SELECT 1 FROM media WHERE id = 70);

-- 4) Upsert category versions (required for Payload admin list with draft=true)
INSERT INTO _categories_v (
  id,
  parent_id,
  version_category_id,
  version_sort_order,
  version_updated_at,
  version_created_at,
  version__status,
  created_at,
  updated_at,
  snapshot,
  published_locale,
  latest
)
VALUES
  (1, 1, NULL, 0, '2025-11-12T06:21:35.881Z', '2025-11-12T06:21:35.881Z', 'published', '2025-11-12T06:21:35.881Z', '2025-11-12T06:21:35.881Z', NULL, 'en', 1),
  (2, 2, 1, 0, '2025-11-12T06:33:28.816Z', '2025-11-12T06:33:28.816Z', 'published', '2025-11-12T06:33:28.816Z', '2025-11-12T06:33:28.816Z', NULL, 'en', 1),
  (3, 3, 2, 0, '2025-11-12T06:34:02.328Z', '2025-11-12T06:34:02.328Z', 'published', '2025-11-12T06:34:02.328Z', '2025-11-12T06:34:02.328Z', NULL, 'en', 1),
  (4, 4, 1, 0, '2025-11-13T03:17:42.199Z', '2025-11-13T03:17:42.199Z', 'published', '2025-11-13T03:17:42.199Z', '2025-11-13T03:17:42.199Z', NULL, 'en', 1),
  (5, 5, 1, 0, '2025-11-14T02:04:43.728Z', '2025-11-14T02:04:43.728Z', 'published', '2025-11-14T02:04:43.728Z', '2025-11-14T02:04:43.728Z', NULL, 'en', 1),
  (6, 6, 3, 0, '2025-11-12T06:39:33.270Z', '2025-11-12T06:35:05.536Z', 'published', '2025-11-12T06:35:05.536Z', '2025-11-12T06:39:33.270Z', NULL, 'en', 1),
  (7, 7, 3, 0, '2025-11-12T06:35:55.352Z', '2025-11-12T06:35:55.352Z', 'published', '2025-11-12T06:35:55.352Z', '2025-11-12T06:35:55.352Z', NULL, 'en', 1),
  (8, 8, 3, 0, '2025-11-12T06:38:52.179Z', '2025-11-12T06:36:28.982Z', 'published', '2025-11-12T06:36:28.982Z', '2025-11-12T06:38:52.179Z', NULL, 'en', 1),
  (9, 9, 3, 0, '2025-11-12T06:39:02.133Z', '2025-11-12T06:37:45.443Z', 'published', '2025-11-12T06:37:45.443Z', '2025-11-12T06:39:02.133Z', NULL, 'en', 1),
  (10, 10, 1, 0, '2025-11-12T06:40:22.801Z', '2025-11-12T06:40:22.801Z', 'published', '2025-11-12T06:40:22.801Z', '2025-11-12T06:40:22.801Z', NULL, 'en', 1),
  (11, 11, 2, 0, '2025-11-13T03:12:43.925Z', '2025-11-13T03:12:43.925Z', 'published', '2025-11-13T03:12:43.925Z', '2025-11-13T03:12:43.925Z', NULL, 'en', 1),
  (12, 12, 4, 0, '2025-11-13T03:18:11.185Z', '2025-11-13T03:18:11.185Z', 'published', '2025-11-13T03:18:11.185Z', '2025-11-13T03:18:11.185Z', NULL, 'en', 1),
  (13, 13, 4, 0, '2025-11-13T03:18:31.916Z', '2025-11-13T03:18:31.916Z', 'published', '2025-11-13T03:18:31.916Z', '2025-11-13T03:18:31.916Z', NULL, 'en', 1),
  (14, 14, 1, 0, '2025-11-13T04:08:24.094Z', '2025-11-13T04:08:24.094Z', 'published', '2025-11-13T04:08:24.094Z', '2025-11-13T04:08:24.094Z', NULL, 'en', 1),
  (15, 15, 5, 0, '2025-11-14T02:05:23.825Z', '2025-11-14T02:05:23.825Z', 'published', '2025-11-14T02:05:23.825Z', '2025-11-14T02:05:23.825Z', NULL, 'en', 1),
  (16, 16, 1, 0, '2025-11-15T02:25:01.389Z', '2025-11-15T02:25:01.389Z', 'published', '2025-11-15T02:25:01.389Z', '2025-11-15T02:25:01.389Z', NULL, 'en', 1),
  (17, 17, 1, 1, '2025-11-17T23:35:56.229Z', '2025-11-17T23:33:39.155Z', 'published', '2025-11-17T23:33:39.155Z', '2025-11-17T23:35:56.229Z', NULL, 'en', 1)
ON CONFLICT(id) DO UPDATE SET
  parent_id = excluded.parent_id,
  version_category_id = excluded.version_category_id,
  version_sort_order = excluded.version_sort_order,
  version_updated_at = excluded.version_updated_at,
  version_created_at = excluded.version_created_at,
  version__status = excluded.version__status,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at,
  snapshot = excluded.snapshot,
  published_locale = excluded.published_locale,
  latest = excluded.latest;

-- 5) Upsert localized version fields
INSERT INTO _categories_v_locales (
  version_name,
  version_picture_id,
  id,
  _locale,
  _parent_id
)
VALUES
  ('Cooking Equipment', NULL, 1, 'en', 1),
  ('Coffee and Chocolate', NULL, 2, 'en', 2),
  ('Chocolate Machines', NULL, 3, 'en', 3),
  ('Commercial Module', NULL, 4, 'en', 4),
  ('Donut Machine', NULL, 5, 'en', 5),
  ('Chocolate Fountain Machine', NULL, 6, 'en', 6),
  ('Chocolate Coating Machine', NULL, 7, 'en', 7),
  ('Chocolate Filling Machine', NULL, 8, 'en', 8),
  ('Chocolate Heat Preservation Machine', NULL, 9, 'en', 9),
  ('Chicken Rotisserie Ovens ', NULL, 10, 'en', 10),
  ('Coffee Machine', NULL, 11, 'en', 11),
  ('900 Series', NULL, 12, 'en', 12),
  ('700 Series', NULL, 13, 'en', 13),
  ('Commercial Griddles', NULL, 14, 'en', 14),
  ('Donut Robot', NULL, 15, 'en', 15),
  ('Candy Floss Machines', NULL, 16, 'en', 16),
  ('Commercial Combination Oven', NULL, 17, 'en', 17)
ON CONFLICT(id) DO UPDATE SET
  version_name = excluded.version_name,
  version_picture_id = excluded.version_picture_id,
  _locale = excluded._locale,
  _parent_id = excluded._parent_id;

-- 6) Patch localized version picture relation when media exists.
UPDATE _categories_v_locales
SET version_picture_id = 70
WHERE _parent_id = 16
  AND _locale = 'en'
  AND EXISTS (SELECT 1 FROM media WHERE id = 70);
