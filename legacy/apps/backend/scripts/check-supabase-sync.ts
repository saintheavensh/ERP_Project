import { drizzle } from 'drizzle-orm/node-postgres';
import { getTableName } from 'drizzle-orm';
import { Client } from 'pg';
import * as schema from '../src/db/schema';

async function checkSync() {
    const client = new Client({ connectionString: process.env.DATABASE_URL! });
    await client.connect();
    const db = drizzle(client);

    // Get all tables from schema
    const schemaTables = Object.values(schema)
        .filter(obj => obj !== null && typeof obj === 'object' && Symbol.for('drizzle:Name') in obj)
        .map(obj => getTableName(obj as any));
    console.log('📊 Tables in schema:', schemaTables.length);

    // Get all tables from database
    const dbTables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);
    console.log('📊 Tables in database:', dbTables.rows.length);

    // Find differences
    const dbTableNames = dbTables.rows.map(t => t.table_name);
    const missingInDB = schemaTables.filter(t => !dbTableNames.includes(t));
    const extraInDB = dbTableNames.filter(t => !schemaTables.includes(t));

    console.log('❌ Missing in database:', missingInDB);
    console.log('⚠️ Extra in database (not in schema):', extraInDB);

    await client.end();
}

checkSync();
