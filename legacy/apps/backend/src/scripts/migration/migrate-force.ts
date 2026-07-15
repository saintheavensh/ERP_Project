import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function forceMigrate() {
    console.log('🔧 FORCE MIGRATION');
    console.log('Using DIRECT_URL:', process.env.DIRECT_URL?.replace(/:[^:@]*@/, ':****@'));

    if (!process.env.DIRECT_URL) {
        console.error('❌ DIRECT_URL not set!');
        process.exit(1);
    }

    try {
        // Koneksi langsung dengan DIRECT_URL
        const migrationClient = postgres(process.env.DIRECT_URL, { max: 1 });
        const db = drizzle(migrationClient);

        console.log('📦 Running migrations...');
        await migrate(db, { migrationsFolder: './drizzle' });

        console.log('✅ Migrations completed!');

        // Verifikasi
        const result = await migrationClient`
            SELECT COUNT(*) as total 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log(`📊 Tables after migration: ${result[0].total}`);

        await migrationClient.end();
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

forceMigrate();