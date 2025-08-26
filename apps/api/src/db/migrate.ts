import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '@/config/env.js';

async function main() {
  try {
    const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
    const db = drizzle(migrationClient);
    
    await migrate(db, { migrationsFolder: 'drizzle' });
    
    await migrationClient.end();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

main();