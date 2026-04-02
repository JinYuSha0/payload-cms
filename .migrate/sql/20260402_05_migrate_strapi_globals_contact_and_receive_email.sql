-- Generated from Strapi CSV data under .migrate/rds_data
-- Scope: contact_information + receive_email globals (with versions tables)
-- Source snapshot:
-- - contact_informations.csv: 2 rows (1 draft, 1 published)
-- - receive_emails.csv: 0 rows
-- Notes:
-- 1) IDs are normalized to stable 1-based IDs.
-- 2) Includes versions tables to support Payload drafts.
-- 3) Intentionally no explicit BEGIN/COMMIT for Cloudflare SQL execution compatibility.

-- 1) Upsert current Contact Information global document (published row)
INSERT INTO contact_information (
  id,
  phone,
  email,
  address,
  _status,
  updated_at,
  created_at
)
VALUES
  (
    1,
    '+86 189 2622 8681',
    'blair@icookingtech.com',
    'BCE Plus Industries International Limited
Room 705, 7th Floor, 75-77 Fa Yuen Street, Mong Kok, Yau Tsim Mong, Kowloon, HongKong',
    'published',
    '2025-11-11T02:29:34.217Z',
    '2025-10-30T01:39:10.355Z'
  )
ON CONFLICT(id) DO UPDATE SET
  phone = excluded.phone,
  email = excluded.email,
  address = excluded.address,
  _status = excluded._status,
  updated_at = excluded.updated_at,
  created_at = excluded.created_at;

-- 2) Upsert Contact Information versions (draft + published)
INSERT INTO _contact_information_v (
  id,
  version_phone,
  version_email,
  version_address,
  version__status,
  version_updated_at,
  version_created_at,
  created_at,
  updated_at,
  snapshot,
  published_locale,
  latest
)
VALUES
  (
    1,
    '+86 189 2622 8681',
    'blair@icookingtech.com',
    'BCE Plus Industries International Limited
Room 705, 7th Floor, 75-77 Fa Yuen Street, Mong Kok, Yau Tsim Mong, Kowloon, HongKong',
    'draft',
    '2025-11-11T02:29:34.217Z',
    '2025-10-30T01:39:10.355Z',
    '2025-10-30T01:39:10.355Z',
    '2025-11-11T02:29:34.217Z',
    NULL,
    NULL,
    0
  ),
  (
    2,
    '+86 189 2622 8681',
    'blair@icookingtech.com',
    'BCE Plus Industries International Limited
Room 705, 7th Floor, 75-77 Fa Yuen Street, Mong Kok, Yau Tsim Mong, Kowloon, HongKong',
    'published',
    '2025-11-11T02:29:34.217Z',
    '2025-10-30T01:39:10.355Z',
    '2025-10-30T01:39:10.355Z',
    '2025-11-11T02:29:34.217Z',
    NULL,
    NULL,
    1
  )
ON CONFLICT(id) DO UPDATE SET
  version_phone = excluded.version_phone,
  version_email = excluded.version_email,
  version_address = excluded.version_address,
  version__status = excluded.version__status,
  version_updated_at = excluded.version_updated_at,
  version_created_at = excluded.version_created_at,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at,
  snapshot = excluded.snapshot,
  published_locale = excluded.published_locale,
  latest = excluded.latest;

-- 3) Receive Email source CSV is empty, so no row is inserted.
-- Keep table untouched unless source data is provided in a future snapshot.
