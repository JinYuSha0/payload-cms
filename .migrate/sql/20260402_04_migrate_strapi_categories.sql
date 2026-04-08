-- Generated from dump2.sql (PostgreSQL)
-- Scope: categories + leaf categories
-- Source counts: 5 categories, 16 leaf categories, 21 total category nodes
-- Notes:
-- 1) IDs keep Strapi source IDs to preserve production/category links.
-- 2) categories + leaf_categories are merged into Payload `categories` tree.
-- 3) picture relation is restored from files_related_mph for both category types.
-- 4) Includes versions tables used by Payload drafts/admin.
-- 5) Intentionally no explicit BEGIN/COMMIT for Cloudflare D1 execution compatibility.

-- 1) Upsert categories tree
INSERT INTO categories (
  id,
  category_id,
  sort_order,
  updated_at,
  created_at,
  _status
)
VALUES
  (2, 6, 0, '2025-11-22T04:40:45.935Z', '2025-11-18T12:10:34.475Z', 'published'),
  (3, NULL, 1, '2025-11-22T04:41:49.665Z', '2025-11-20T03:57:46.445Z', 'published'),
  (4, NULL, 2, '2025-11-24T04:15:30.25Z', '2025-11-22T04:39:32.734Z', 'published'),
  (5, NULL, 3, '2025-11-22T04:42:27.3Z', '2025-11-22T04:39:53.437Z', 'published'),
  (6, NULL, 4, '2025-11-22T04:42:41.862Z', '2025-11-22T04:40:17.643Z', 'published'),
  (7, 3, 0, '2025-11-22T04:43:26.291Z', '2025-11-18T11:53:07.425Z', 'published'),
  (8, 3, 0, '2025-11-20T02:14:44.92Z', '2025-11-20T01:58:56.043Z', 'published'),
  (9, 3, 0, '2025-11-20T03:58:51.22Z', '2025-11-20T03:58:51.22Z', 'published'),
  (10, 4, 0, '2025-11-24T06:06:41.67Z', '2025-11-24T06:06:41.67Z', 'published'),
  (11, 4, 0, '2025-11-24T06:07:24.11Z', '2025-11-24T06:07:24.11Z', 'published'),
  (12, 6, 0, '2025-11-24T06:50:22.909Z', '2025-11-24T06:50:22.909Z', 'published'),
  (13, 6, 0, '2025-11-27T01:54:15.879Z', '2025-11-24T06:51:31.704Z', 'published'),
  (14, 5, 0, '2025-11-25T07:12:23.363Z', '2025-11-25T07:12:23.363Z', 'published'),
  (15, 5, 0, '2025-11-25T07:13:30.123Z', '2025-11-25T07:13:30.123Z', 'published'),
  (16, 6, 0, '2025-11-27T01:52:15.562Z', '2025-11-27T01:52:15.562Z', 'published'),
  (17, 6, 0, '2025-11-27T01:54:44.475Z', '2025-11-27T01:54:44.475Z', 'published'),
  (19, 6, 0, '2025-11-27T01:57:28.222Z', '2025-11-27T01:57:28.222Z', 'published'),
  (20, 6, 0, '2025-11-27T01:57:59.433Z', '2025-11-27T01:57:59.433Z', 'published'),
  (21, 3, 0, '2025-11-27T07:37:14.35Z', '2025-11-27T07:10:53.51Z', 'published'),
  (22, 6, 0, '2025-12-01T06:25:34.983Z', '2025-11-28T01:06:16.653Z', 'published'),
  (23, 3, 0, '2025-12-01T09:03:47.769Z', '2025-12-01T09:03:47.769Z', 'published')
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  updated_at = excluded.updated_at,
  created_at = excluded.created_at,
  _status = excluded._status;

-- 2) Upsert categories_locales
INSERT INTO categories_locales (
  name,
  picture_id,
  id,
  _locale,
  _parent_id
)
VALUES
  ('Doughnut Machine', NULL, 2, 'en', 2),
  ('Commercial Range', NULL, 3, 'en', 3),
  ('Modular Range', NULL, 4, 'en', 4),
  ('Bakery Range', NULL, 5, 'en', 5),
  ('Snack Range', NULL, 6, 'en', 6),
  ('Commercial Combination Oven', NULL, 7, 'en', 7),
  ('Commercial Gas Equipment', NULL, 8, 'en', 8),
  ('Commercial Electric Equipment', NULL, 9, 'en', 9),
  ('Floorstanding Modular', NULL, 10, 'en', 10),
  ('Countertop Modular', NULL, 11, 'en', 11),
  ('Waffle Maker', NULL, 12, 'en', 12),
  ('Juice Warmer', NULL, 13, 'en', 13),
  ('Conveyor Toaster', NULL, 14, 'en', 14),
  ('Slice Toaster', NULL, 15, 'en', 15),
  ('Panini Pressing grill', NULL, 16, 'en', 16),
  ('Chip Warmer', NULL, 17, 'en', 17),
  ('Candy Floss Machine', NULL, 19, 'en', 19),
  ('Popcorn Machine', NULL, 20, 'en', 20),
  ('Countertop Griddle', NULL, 21, 'en', 21),
  ('Crepe Machine', 404, 22, 'en', 22),
  ('Commercial Convection Oven', NULL, 23, 'en', 23)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  picture_id = excluded.picture_id,
  _locale = excluded._locale,
  _parent_id = excluded._parent_id;

-- 3) Upsert _categories_v
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
  (2, 2, 6, 0, '2025-11-22T04:40:45.935Z', '2025-11-18T12:10:34.475Z', 'published', '2025-11-18T12:10:34.475Z', '2025-11-22T04:40:45.935Z', NULL, 'en', 1),
  (3, 3, NULL, 1, '2025-11-22T04:41:49.665Z', '2025-11-20T03:57:46.445Z', 'published', '2025-11-20T03:57:46.445Z', '2025-11-22T04:41:49.665Z', NULL, 'en', 1),
  (4, 4, NULL, 2, '2025-11-24T04:15:30.25Z', '2025-11-22T04:39:32.734Z', 'published', '2025-11-22T04:39:32.734Z', '2025-11-24T04:15:30.25Z', NULL, 'en', 1),
  (5, 5, NULL, 3, '2025-11-22T04:42:27.3Z', '2025-11-22T04:39:53.437Z', 'published', '2025-11-22T04:39:53.437Z', '2025-11-22T04:42:27.3Z', NULL, 'en', 1),
  (6, 6, NULL, 4, '2025-11-22T04:42:41.862Z', '2025-11-22T04:40:17.643Z', 'published', '2025-11-22T04:40:17.643Z', '2025-11-22T04:42:41.862Z', NULL, 'en', 1),
  (7, 7, 3, 0, '2025-11-22T04:43:26.291Z', '2025-11-18T11:53:07.425Z', 'published', '2025-11-18T11:53:07.425Z', '2025-11-22T04:43:26.291Z', NULL, 'en', 1),
  (8, 8, 3, 0, '2025-11-20T02:14:44.92Z', '2025-11-20T01:58:56.043Z', 'published', '2025-11-20T01:58:56.043Z', '2025-11-20T02:14:44.92Z', NULL, 'en', 1),
  (9, 9, 3, 0, '2025-11-20T03:58:51.22Z', '2025-11-20T03:58:51.22Z', 'published', '2025-11-20T03:58:51.22Z', '2025-11-20T03:58:51.22Z', NULL, 'en', 1),
  (10, 10, 4, 0, '2025-11-24T06:06:41.67Z', '2025-11-24T06:06:41.67Z', 'published', '2025-11-24T06:06:41.67Z', '2025-11-24T06:06:41.67Z', NULL, 'en', 1),
  (11, 11, 4, 0, '2025-11-24T06:07:24.11Z', '2025-11-24T06:07:24.11Z', 'published', '2025-11-24T06:07:24.11Z', '2025-11-24T06:07:24.11Z', NULL, 'en', 1),
  (12, 12, 6, 0, '2025-11-24T06:50:22.909Z', '2025-11-24T06:50:22.909Z', 'published', '2025-11-24T06:50:22.909Z', '2025-11-24T06:50:22.909Z', NULL, 'en', 1),
  (13, 13, 6, 0, '2025-11-27T01:54:15.879Z', '2025-11-24T06:51:31.704Z', 'published', '2025-11-24T06:51:31.704Z', '2025-11-27T01:54:15.879Z', NULL, 'en', 1),
  (14, 14, 5, 0, '2025-11-25T07:12:23.363Z', '2025-11-25T07:12:23.363Z', 'published', '2025-11-25T07:12:23.363Z', '2025-11-25T07:12:23.363Z', NULL, 'en', 1),
  (15, 15, 5, 0, '2025-11-25T07:13:30.123Z', '2025-11-25T07:13:30.123Z', 'published', '2025-11-25T07:13:30.123Z', '2025-11-25T07:13:30.123Z', NULL, 'en', 1),
  (16, 16, 6, 0, '2025-11-27T01:52:15.562Z', '2025-11-27T01:52:15.562Z', 'published', '2025-11-27T01:52:15.562Z', '2025-11-27T01:52:15.562Z', NULL, 'en', 1),
  (17, 17, 6, 0, '2025-11-27T01:54:44.475Z', '2025-11-27T01:54:44.475Z', 'published', '2025-11-27T01:54:44.475Z', '2025-11-27T01:54:44.475Z', NULL, 'en', 1),
  (19, 19, 6, 0, '2025-11-27T01:57:28.222Z', '2025-11-27T01:57:28.222Z', 'published', '2025-11-27T01:57:28.222Z', '2025-11-27T01:57:28.222Z', NULL, 'en', 1),
  (20, 20, 6, 0, '2025-11-27T01:57:59.433Z', '2025-11-27T01:57:59.433Z', 'published', '2025-11-27T01:57:59.433Z', '2025-11-27T01:57:59.433Z', NULL, 'en', 1),
  (21, 21, 3, 0, '2025-11-27T07:37:14.35Z', '2025-11-27T07:10:53.51Z', 'published', '2025-11-27T07:10:53.51Z', '2025-11-27T07:37:14.35Z', NULL, 'en', 1),
  (22, 22, 6, 0, '2025-12-01T06:25:34.983Z', '2025-11-28T01:06:16.653Z', 'published', '2025-11-28T01:06:16.653Z', '2025-12-01T06:25:34.983Z', NULL, 'en', 1),
  (23, 23, 3, 0, '2025-12-01T09:03:47.769Z', '2025-12-01T09:03:47.769Z', 'published', '2025-12-01T09:03:47.769Z', '2025-12-01T09:03:47.769Z', NULL, 'en', 1)
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

-- 4) Upsert _categories_v_locales
INSERT INTO _categories_v_locales (
  version_name,
  version_picture_id,
  id,
  _locale,
  _parent_id
)
VALUES
  ('Doughnut Machine', NULL, 2, 'en', 2),
  ('Commercial Range', NULL, 3, 'en', 3),
  ('Modular Range', NULL, 4, 'en', 4),
  ('Bakery Range', NULL, 5, 'en', 5),
  ('Snack Range', NULL, 6, 'en', 6),
  ('Commercial Combination Oven', NULL, 7, 'en', 7),
  ('Commercial Gas Equipment', NULL, 8, 'en', 8),
  ('Commercial Electric Equipment', NULL, 9, 'en', 9),
  ('Floorstanding Modular', NULL, 10, 'en', 10),
  ('Countertop Modular', NULL, 11, 'en', 11),
  ('Waffle Maker', NULL, 12, 'en', 12),
  ('Juice Warmer', NULL, 13, 'en', 13),
  ('Conveyor Toaster', NULL, 14, 'en', 14),
  ('Slice Toaster', NULL, 15, 'en', 15),
  ('Panini Pressing grill', NULL, 16, 'en', 16),
  ('Chip Warmer', NULL, 17, 'en', 17),
  ('Candy Floss Machine', NULL, 19, 'en', 19),
  ('Popcorn Machine', NULL, 20, 'en', 20),
  ('Countertop Griddle', NULL, 21, 'en', 21),
  ('Crepe Machine', 404, 22, 'en', 22),
  ('Commercial Convection Oven', NULL, 23, 'en', 23)
ON CONFLICT(id) DO UPDATE SET
  version_name = excluded.version_name,
  version_picture_id = excluded.version_picture_id,
  _locale = excluded._locale,
  _parent_id = excluded._parent_id;

