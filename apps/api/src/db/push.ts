import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '../config/env.js';
import * as schema from './schema.js';

async function main() {
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  console.log('🚀 Pushing schema to database...');

  try {
    await migrate(db, { migrationsFolder: 'drizzle' });

    console.log('✅ Schema pushed successfully');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Schema push failed:', error);
    process.exit(1);
  }
}

main();
