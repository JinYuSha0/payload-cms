import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260227_084506_migrate_strapi_categories_only from './20260227_084506_migrate_strapi_categories_only';
import * as migration_20260402_035217_add_payload_folders_locked_docs_rel from './20260402_035217_add_payload_folders_locked_docs_rel';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260227_084506_migrate_strapi_categories_only.up,
    down: migration_20260227_084506_migrate_strapi_categories_only.down,
    name: '20260227_084506_migrate_strapi_categories_only',
  },
  {
    up: migration_20260402_035217_add_payload_folders_locked_docs_rel.up,
    down: migration_20260402_035217_add_payload_folders_locked_docs_rel.down,
    name: '20260402_035217_add_payload_folders_locked_docs_rel'
  },
];
