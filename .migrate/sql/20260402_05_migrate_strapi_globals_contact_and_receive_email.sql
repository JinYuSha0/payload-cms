-- Generated from dump2.sql (PostgreSQL)
-- Scope: contact_information + receive_email globals (with versions)
-- Source counts: contact_informations=2, receive_emails=2
-- Notes:
-- 1) Current global row uses latest published row when available (else latest draft).
-- 2) Versions tables keep all source rows as history snapshots.
-- 3) Intentionally no explicit BEGIN/COMMIT for Cloudflare D1 execution compatibility.

-- 1) Upsert contact_information current row
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
  (1, '+86 186 6402 8679', 'raymond@xinzhuolian.com', 'Unit 101, No. 31, 4th Street, Nanyang Zhuang, Qingbu Village, Xinya Street, Huadu District, Guangzhou City, Guangdong Province, China', 'published', '2025-12-01T08:02:49.352Z', '2025-12-01T08:02:49.352Z')
ON CONFLICT(id) DO UPDATE SET
  phone = excluded.phone,
  email = excluded.email,
  address = excluded.address,
  _status = excluded._status,
  updated_at = excluded.updated_at,
  created_at = excluded.created_at;

-- 2) Upsert _contact_information_v
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
  (1, '+86 186 6402 8679', 'raymond@xinzhuolian.com', 'Unit 101, No. 31, 4th Street, Nanyang Zhuang, Qingbu Village, Xinya Street, Huadu District, Guangzhou City, Guangdong Province, China', 'draft', '2025-12-01T08:02:49.352Z', '2025-12-01T08:02:49.352Z', '2025-12-01T08:02:49.352Z', '2025-12-01T08:02:49.352Z', NULL, NULL, 0),
  (2, '+86 186 6402 8679', 'raymond@xinzhuolian.com', 'Unit 101, No. 31, 4th Street, Nanyang Zhuang, Qingbu Village, Xinya Street, Huadu District, Guangzhou City, Guangdong Province, China', 'published', '2025-12-01T08:02:49.352Z', '2025-12-01T08:02:49.352Z', '2025-12-01T08:02:49.352Z', '2025-12-01T08:02:49.352Z', NULL, NULL, 1)
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

-- 3) Upsert receive_email current row
INSERT INTO receive_email (
  id,
  email,
  _status,
  updated_at,
  created_at
)
VALUES
  (1, 'info@xinzhuolian.com', 'published', '2025-12-01T08:06:41.258Z', '2025-12-01T08:06:41.258Z')
ON CONFLICT(id) DO UPDATE SET
  email = excluded.email,
  _status = excluded._status,
  updated_at = excluded.updated_at,
  created_at = excluded.created_at;

-- 4) Upsert _receive_email_v
INSERT INTO _receive_email_v (
  id,
  version_email,
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
  (1, 'info@xinzhuolian.com', 'draft', '2025-12-01T08:06:41.258Z', '2025-12-01T08:06:41.258Z', '2025-12-01T08:06:41.258Z', '2025-12-01T08:06:41.258Z', NULL, NULL, 0),
  (2, 'info@xinzhuolian.com', 'published', '2025-12-01T08:06:41.258Z', '2025-12-01T08:06:41.258Z', '2025-12-01T08:06:41.258Z', '2025-12-01T08:06:41.258Z', NULL, NULL, 1)
ON CONFLICT(id) DO UPDATE SET
  version_email = excluded.version_email,
  version__status = excluded.version__status,
  version_updated_at = excluded.version_updated_at,
  version_created_at = excluded.version_created_at,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at,
  snapshot = excluded.snapshot,
  published_locale = excluded.published_locale,
  latest = excluded.latest;

