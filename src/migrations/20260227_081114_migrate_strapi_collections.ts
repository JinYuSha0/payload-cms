import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`categories\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`category_id\` integer,
  	\`sort_order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_category_idx\` ON \`categories\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_sort_order_idx\` ON \`categories\` (\`sort_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_updated_at_idx\` ON \`categories\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`categories_created_at_idx\` ON \`categories\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`categories__status_idx\` ON \`categories\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`categories_locales\` (
  	\`name\` text,
  	\`picture_id\` integer,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`picture_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`categories_name_idx\` ON \`categories_locales\` (\`name\`,\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`categories_picture_idx\` ON \`categories_locales\` (\`picture_id\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`categories_locales_locale_parent_id_unique\` ON \`categories_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_categories_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_category_id\` integer,
  	\`version_sort_order\` numeric DEFAULT 0,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_categories_v_parent_idx\` ON \`_categories_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_version_version_category_idx\` ON \`_categories_v\` (\`version_category_id\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_version_version_sort_order_idx\` ON \`_categories_v\` (\`version_sort_order\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_version_version_updated_at_idx\` ON \`_categories_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_version_version_created_at_idx\` ON \`_categories_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_version_version__status_idx\` ON \`_categories_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_created_at_idx\` ON \`_categories_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_updated_at_idx\` ON \`_categories_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_snapshot_idx\` ON \`_categories_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_published_locale_idx\` ON \`_categories_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_latest_idx\` ON \`_categories_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`_categories_v_locales\` (
  	\`version_name\` text,
  	\`version_picture_id\` integer,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`version_picture_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_categories_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_categories_v_version_version_name_idx\` ON \`_categories_v_locales\` (\`version_name\`,\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_categories_v_version_version_picture_idx\` ON \`_categories_v_locales\` (\`version_picture_id\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`_categories_v_locales_locale_parent_id_unique\` ON \`_categories_v_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`leaf_categories\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`category_id\` integer,
  	\`sort_order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`leaf_categories_category_idx\` ON \`leaf_categories\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`leaf_categories_sort_order_idx\` ON \`leaf_categories\` (\`sort_order\`);`)
  await db.run(sql`CREATE INDEX \`leaf_categories_updated_at_idx\` ON \`leaf_categories\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`leaf_categories_created_at_idx\` ON \`leaf_categories\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`leaf_categories__status_idx\` ON \`leaf_categories\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`leaf_categories_locales\` (
  	\`name\` text,
  	\`picture_id\` integer,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`picture_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`leaf_categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`leaf_categories_picture_idx\` ON \`leaf_categories_locales\` (\`picture_id\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`leaf_categories_locales_locale_parent_id_unique\` ON \`leaf_categories_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_leaf_categories_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_category_id\` integer,
  	\`version_sort_order\` numeric DEFAULT 0,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`leaf_categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_leaf_categories_v_parent_idx\` ON \`_leaf_categories_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_leaf_categories_v_version_version_category_idx\` ON \`_leaf_categories_v\` (\`version_category_id\`);`)
  await db.run(sql`CREATE INDEX \`_leaf_categories_v_version_version_sort_order_idx\` ON \`_leaf_categories_v\` (\`version_sort_order\`);`)
  await db.run(sql`CREATE INDEX \`_leaf_categories_v_version_version_updated_at_idx\` ON \`_leaf_categories_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_leaf_categories_v_version_version_created_at_idx\` ON \`_leaf_categories_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_leaf_categories_v_version_version__status_idx\` ON \`_leaf_categories_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_leaf_categories_v_created_at_idx\` ON \`_leaf_categories_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_leaf_categories_v_updated_at_idx\` ON \`_leaf_categories_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_leaf_categories_v_snapshot_idx\` ON \`_leaf_categories_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_leaf_categories_v_published_locale_idx\` ON \`_leaf_categories_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_leaf_categories_v_latest_idx\` ON \`_leaf_categories_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`_leaf_categories_v_locales\` (
  	\`version_name\` text,
  	\`version_picture_id\` integer,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`version_picture_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_leaf_categories_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_leaf_categories_v_version_version_picture_idx\` ON \`_leaf_categories_v_locales\` (\`version_picture_id\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`_leaf_categories_v_locales_locale_parent_id_unique\` ON \`_leaf_categories_v_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`productions\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`leaf_category_id\` integer,
  	\`sort_order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`leaf_category_id\`) REFERENCES \`leaf_categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`productions_leaf_category_idx\` ON \`productions\` (\`leaf_category_id\`);`)
  await db.run(sql`CREATE INDEX \`productions_sort_order_idx\` ON \`productions\` (\`sort_order\`);`)
  await db.run(sql`CREATE INDEX \`productions_updated_at_idx\` ON \`productions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`productions_created_at_idx\` ON \`productions\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`productions__status_idx\` ON \`productions\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`productions_locales\` (
  	\`name\` text,
  	\`content\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`productions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`productions_name_idx\` ON \`productions_locales\` (\`name\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`productions_locales_locale_parent_id_unique\` ON \`productions_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`productions_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`locale\` text,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`productions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`productions_rels_order_idx\` ON \`productions_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`productions_rels_parent_idx\` ON \`productions_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`productions_rels_path_idx\` ON \`productions_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`productions_rels_locale_idx\` ON \`productions_rels\` (\`locale\`);`)
  await db.run(sql`CREATE INDEX \`productions_rels_media_id_idx\` ON \`productions_rels\` (\`media_id\`,\`locale\`);`)
  await db.run(sql`CREATE TABLE \`_productions_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_leaf_category_id\` integer,
  	\`version_sort_order\` numeric DEFAULT 0,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`productions\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_leaf_category_id\`) REFERENCES \`leaf_categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_productions_v_parent_idx\` ON \`_productions_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_version_version_leaf_category_idx\` ON \`_productions_v\` (\`version_leaf_category_id\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_version_version_sort_order_idx\` ON \`_productions_v\` (\`version_sort_order\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_version_version_updated_at_idx\` ON \`_productions_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_version_version_created_at_idx\` ON \`_productions_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_version_version__status_idx\` ON \`_productions_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_created_at_idx\` ON \`_productions_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_updated_at_idx\` ON \`_productions_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_snapshot_idx\` ON \`_productions_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_published_locale_idx\` ON \`_productions_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_latest_idx\` ON \`_productions_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`_productions_v_locales\` (
  	\`version_name\` text,
  	\`version_content\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_productions_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_productions_v_version_version_name_idx\` ON \`_productions_v_locales\` (\`version_name\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`_productions_v_locales_locale_parent_id_unique\` ON \`_productions_v_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_productions_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`locale\` text,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_productions_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_productions_v_rels_order_idx\` ON \`_productions_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_rels_parent_idx\` ON \`_productions_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_rels_path_idx\` ON \`_productions_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_rels_locale_idx\` ON \`_productions_v_rels\` (\`locale\`);`)
  await db.run(sql`CREATE INDEX \`_productions_v_rels_media_id_idx\` ON \`_productions_v_rels\` (\`media_id\`,\`locale\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`contact_information\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`phone\` text,
  	\`email\` text,
  	\`address\` text,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`contact_information__status_idx\` ON \`contact_information\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_contact_information_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_phone\` text,
  	\`version_email\` text,
  	\`version_address\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer
  );
  `)
  await db.run(sql`CREATE INDEX \`_contact_information_v_version_version__status_idx\` ON \`_contact_information_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_contact_information_v_created_at_idx\` ON \`_contact_information_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_contact_information_v_updated_at_idx\` ON \`_contact_information_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_contact_information_v_snapshot_idx\` ON \`_contact_information_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_contact_information_v_published_locale_idx\` ON \`_contact_information_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_contact_information_v_latest_idx\` ON \`_contact_information_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`receive_email\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`email\` text,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`receive_email__status_idx\` ON \`receive_email\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_receive_email_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_email\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer
  );
  `)
  await db.run(sql`CREATE INDEX \`_receive_email_v_version_version__status_idx\` ON \`_receive_email_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_receive_email_v_created_at_idx\` ON \`_receive_email_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_receive_email_v_updated_at_idx\` ON \`_receive_email_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_receive_email_v_snapshot_idx\` ON \`_receive_email_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_receive_email_v_published_locale_idx\` ON \`_receive_email_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_receive_email_v_latest_idx\` ON \`_receive_email_v\` (\`latest\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`categories_id\` integer REFERENCES categories(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`leaf_categories_id\` integer REFERENCES leaf_categories(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`productions_id\` integer REFERENCES productions(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_leaf_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`leaf_categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_productions_id_idx\` ON \`payload_locked_documents_rels\` (\`productions_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`categories\`;`)
  await db.run(sql`DROP TABLE \`categories_locales\`;`)
  await db.run(sql`DROP TABLE \`_categories_v\`;`)
  await db.run(sql`DROP TABLE \`_categories_v_locales\`;`)
  await db.run(sql`DROP TABLE \`leaf_categories\`;`)
  await db.run(sql`DROP TABLE \`leaf_categories_locales\`;`)
  await db.run(sql`DROP TABLE \`_leaf_categories_v\`;`)
  await db.run(sql`DROP TABLE \`_leaf_categories_v_locales\`;`)
  await db.run(sql`DROP TABLE \`productions\`;`)
  await db.run(sql`DROP TABLE \`productions_locales\`;`)
  await db.run(sql`DROP TABLE \`productions_rels\`;`)
  await db.run(sql`DROP TABLE \`_productions_v\`;`)
  await db.run(sql`DROP TABLE \`_productions_v_locales\`;`)
  await db.run(sql`DROP TABLE \`_productions_v_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`contact_information\`;`)
  await db.run(sql`DROP TABLE \`_contact_information_v\`;`)
  await db.run(sql`DROP TABLE \`receive_email\`;`)
  await db.run(sql`DROP TABLE \`_receive_email_v\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
}
