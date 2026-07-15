
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/infrastructure/database/schema';

async function verify() {
    console.log('🔍 Verifying database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));

    try {
        const client = postgres(process.env.DATABASE_URL!);
        const db = drizzle(client, { schema });

        // Test 1: Koneksi
        const result = await client`SELECT current_database() as db, current_user as user`;
        console.log('✅ Connected to:', result[0]);

        // Test 2: Cek tabel dari schema
        const tables = Object.keys(schema).filter(k => !k.includes('Relations'));
        console.log('📊 Tables in SCHEMA:', tables.length);

        // Test 3: Cek tabel di database
        const dbTables = await client`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log('📊 Tables in DATABASE:', dbTables.length);

        if (dbTables.length === 0) {
            console.log('❌ DATABASE KOSONG! Migration tidak jalan di sini.');
        } else {
            console.log('✅ Database memiliki tabel:', dbTables.map(t => t.table_name).join(', '));
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

verify();