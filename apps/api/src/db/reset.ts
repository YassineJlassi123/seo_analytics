import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { env } from '../config/env.js';

async function main() {
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  console.log('🚀 Resetting database...');

  try {
    await db.execute(sql`DROP TABLE IF EXISTS "reports" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "websites" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "_drizzle_migrations" CASCADE`);

    console.log('✅ Database reset successfully');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

main();
