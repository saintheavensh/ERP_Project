import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';

async function fixSync() {
    console.log('🔧 Fixing migration sync...');

    // Reset entire public schema to force a clean slate for the migrations
    const resetClient = new Client({ connectionString: process.env.DATABASE_URL! });
    await resetClient.connect();
    await resetClient.query(`
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
    `);
    await resetClient.end();

    // Re-run migrations fresh
    const migrationClient = new Client({ connectionString: process.env.DATABASE_URL! });
    await migrationClient.connect();
    await migrate(drizzle(migrationClient), {
        migrationsFolder: 'drizzle',
    });
    await migrationClient.end();

    console.log('✅ Migration sync fixed!');
}

fixSync();
