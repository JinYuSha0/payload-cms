import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`categories\` ADD \`seo_a_i_generated_at\` text;`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`seo_a_i_model\` text;`)
  await db.run(sql`ALTER TABLE \`_categories_v\` ADD \`version_seo_a_i_generated_at\` text;`)
  await db.run(sql`ALTER TABLE \`_categories_v\` ADD \`version_seo_a_i_model\` text;`)

  await db.run(sql`CREATE TABLE \`productions_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	\`locale\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`productions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX \`productions_texts_order_parent\` ON \`productions_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`productions_texts_locale_parent\` ON \`productions_texts\` (\`locale\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_productions_v_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	\`locale\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_productions_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX \`_productions_v_texts_order_parent\` ON \`_productions_v_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_texts_locale_parent\` ON \`_productions_v_texts\` (\`locale\`,\`parent_id\`);`)
  await db.run(sql`ALTER TABLE \`productions_locales\` ADD \`intro\` text;`)
  await db.run(sql`ALTER TABLE \`_productions_v_locales\` ADD \`version_intro\` text;`)

  await db.run(sql`ALTER TABLE \`productions\` ADD \`seo_a_i_generated_at\` text;`)
  await db.run(sql`ALTER TABLE \`productions\` ADD \`seo_a_i_model\` text;`)
  await db.run(sql`ALTER TABLE \`_productions_v\` ADD \`version_seo_a_i_generated_at\` text;`)
  await db.run(sql`ALTER TABLE \`_productions_v\` ADD \`version_seo_a_i_model\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`seo_a_i_generated_at\`;`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`seo_a_i_model\`;`)
  await db.run(sql`ALTER TABLE \`_categories_v\` DROP COLUMN \`version_seo_a_i_generated_at\`;`)
  await db.run(sql`ALTER TABLE \`_categories_v\` DROP COLUMN \`version_seo_a_i_model\`;`)

  await db.run(sql`DROP TABLE \`productions_texts\`;`)
  await db.run(sql`DROP TABLE \`_productions_v_texts\`;`)
  await db.run(sql`ALTER TABLE \`productions_locales\` DROP COLUMN \`intro\`;`)
  await db.run(sql`ALTER TABLE \`_productions_v_locales\` DROP COLUMN \`version_intro\`;`)
  await db.run(sql`ALTER TABLE \`productions\` DROP COLUMN \`seo_a_i_generated_at\`;`)
  await db.run(sql`ALTER TABLE \`productions\` DROP COLUMN \`seo_a_i_model\`;`)
  await db.run(sql`ALTER TABLE \`_productions_v\` DROP COLUMN \`version_seo_a_i_generated_at\`;`)
  await db.run(sql`ALTER TABLE \`_productions_v\` DROP COLUMN \`version_seo_a_i_model\`;`)
}
