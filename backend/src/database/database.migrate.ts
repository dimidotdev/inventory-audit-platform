import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as path from 'path';
import { databaseSslOptions } from './database.config';

/**
 * Run database migrations programmatically.
 * Called on application bootstrap.
 */
export async function runMigrations(
  databaseUrl: string,
  databaseSsl?: string,
  rejectUnauthorized?: string,
) {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseSslOptions(databaseSsl, rejectUnauthorized),
  });

  const db = drizzle(pool);

  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  await migrate(db, { migrationsFolder });

  await pool.end();
}
