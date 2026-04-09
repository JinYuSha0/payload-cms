import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`categories_status_sort_idx\` ON \`categories\` (\`_status\`, \`sort_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`productions_status_sort_idx\` ON \`productions\` (\`_status\`, \`sort_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`productions_status_leaf_sort_idx\` ON \`productions\` (\`_status\`, \`leaf_category_id\`, \`sort_order\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`categories_status_sort_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`productions_status_sort_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`productions_status_leaf_sort_idx\`;`)
}
