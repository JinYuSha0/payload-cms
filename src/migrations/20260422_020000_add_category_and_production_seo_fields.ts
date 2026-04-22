import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`categories\` ADD \`slug\` text;`)
  await db.run(sql`CREATE UNIQUE INDEX \`categories_slug_idx\` ON \`categories\` (\`slug\`);`)
  await db.run(sql`ALTER TABLE \`categories_locales\` ADD \`seo_title\` text;`)
  await db.run(sql`ALTER TABLE \`categories_locales\` ADD \`seo_description\` text;`)
  await db.run(sql`ALTER TABLE \`_categories_v\` ADD \`version_slug\` text;`)
  await db.run(sql`CREATE INDEX \`_categories_v_version_version_slug_idx\` ON \`_categories_v\` (\`version_slug\`);`)
  await db.run(sql`ALTER TABLE \`_categories_v_locales\` ADD \`version_seo_title\` text;`)
  await db.run(sql`ALTER TABLE \`_categories_v_locales\` ADD \`version_seo_description\` text;`)

  await db.run(sql`ALTER TABLE \`productions\` ADD \`slug\` text;`)
  await db.run(sql`CREATE UNIQUE INDEX \`productions_slug_idx\` ON \`productions\` (\`slug\`);`)
  await db.run(sql`ALTER TABLE \`productions_locales\` ADD \`seo_title\` text;`)
  await db.run(sql`ALTER TABLE \`productions_locales\` ADD \`seo_description\` text;`)
  await db.run(sql`ALTER TABLE \`_productions_v\` ADD \`version_slug\` text;`)
  await db.run(sql`CREATE INDEX \`_productions_v_version_version_slug_idx\` ON \`_productions_v\` (\`version_slug\`);`)
  await db.run(sql`ALTER TABLE \`_productions_v_locales\` ADD \`version_seo_title\` text;`)
  await db.run(sql`ALTER TABLE \`_productions_v_locales\` ADD \`version_seo_description\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`categories_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`slug\`;`)
  await db.run(sql`DROP INDEX \`_categories_v_version_version_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`_categories_v\` DROP COLUMN \`version_slug\`;`)
  await db.run(sql`ALTER TABLE \`categories_locales\` DROP COLUMN \`seo_title\`;`)
  await db.run(sql`ALTER TABLE \`categories_locales\` DROP COLUMN \`seo_description\`;`)
  await db.run(sql`ALTER TABLE \`_categories_v_locales\` DROP COLUMN \`version_seo_title\`;`)
  await db.run(sql`ALTER TABLE \`_categories_v_locales\` DROP COLUMN \`version_seo_description\`;`)

  await db.run(sql`DROP INDEX \`productions_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`productions\` DROP COLUMN \`slug\`;`)
  await db.run(sql`DROP INDEX \`_productions_v_version_version_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`_productions_v\` DROP COLUMN \`version_slug\`;`)
  await db.run(sql`ALTER TABLE \`productions_locales\` DROP COLUMN \`seo_title\`;`)
  await db.run(sql`ALTER TABLE \`productions_locales\` DROP COLUMN \`seo_description\`;`)
  await db.run(sql`ALTER TABLE \`_productions_v_locales\` DROP COLUMN \`version_seo_title\`;`)
  await db.run(sql`ALTER TABLE \`_productions_v_locales\` DROP COLUMN \`version_seo_description\`;`)
}
