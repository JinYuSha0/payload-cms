import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260227_084506_migrate_strapi_categories_only from './20260227_084506_migrate_strapi_categories_only';
import * as migration_20260402_035217_add_payload_folders_locked_docs_rel from './20260402_035217_add_payload_folders_locked_docs_rel';
import * as migration_20260409_120000_query_perf_indexes from './20260409_120000_query_perf_indexes';
import * as migration_20260409_130158_add_contacts_and_subscribers from './20260409_130158_add_contacts_and_subscribers';
import * as migration_20260416_032342 from './20260416_032342';
import * as migration_20260422_020000_add_category_and_production_seo_fields from './20260422_020000_add_category_and_production_seo_fields';
import * as migration_20260422_030000_add_docx_and_seo_ai_support from './20260422_030000_add_docx_and_seo_ai_support';
import * as migration_20260423_010000_add_blogs_collection from './20260423_010000_add_blogs_collection';

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
    name: '20260402_035217_add_payload_folders_locked_docs_rel',
  },
  {
    up: migration_20260409_120000_query_perf_indexes.up,
    down: migration_20260409_120000_query_perf_indexes.down,
    name: '20260409_120000_query_perf_indexes',
  },
  {
    up: migration_20260409_130158_add_contacts_and_subscribers.up,
    down: migration_20260409_130158_add_contacts_and_subscribers.down,
    name: '20260409_130158_add_contacts_and_subscribers',
  },
  {
    up: migration_20260416_032342.up,
    down: migration_20260416_032342.down,
    name: '20260416_032342'
  },
  {
    up: migration_20260422_020000_add_category_and_production_seo_fields.up,
    down: migration_20260422_020000_add_category_and_production_seo_fields.down,
    name: '20260422_020000_add_category_and_production_seo_fields',
  },
  {
    up: migration_20260422_030000_add_docx_and_seo_ai_support.up,
    down: migration_20260422_030000_add_docx_and_seo_ai_support.down,
    name: '20260422_030000_add_docx_and_seo_ai_support',
  },
  {
    up: migration_20260423_010000_add_blogs_collection.up,
    down: migration_20260423_010000_add_blogs_collection.down,
    name: '20260423_010000_add_blogs_collection',
  },
];
