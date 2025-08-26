import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { env } from '../config/env.js';

async function main() {
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  console.log('🚀 Fetching tables...');

  try {
    const result = await db.execute(sql`
      SELECT schemaname, tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname != 'pg_catalog' AND
            schemaname != 'information_schema';
    `);

    console.log('✅ Tables found:');
    console.table(result.map((r: any) => ({ schema: r.schemaname, table: r.tablename })));

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to fetch tables:', error);
    process.exit(1);
  }
}

main();
