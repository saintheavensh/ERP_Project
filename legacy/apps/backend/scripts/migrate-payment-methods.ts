import { Database } from 'bun:sqlite';
import path from 'path';

const dbPath = path.join(import.meta.dir, '..', 'data', 'store.db');
const db = new Database(dbPath);

// Disable foreign keys temporarily
db.run('PRAGMA foreign_keys = OFF');

try {
    // Create payment_methods table if not exists
    db.run(`
        CREATE TABLE IF NOT EXISTS payment_methods (
            id text PRIMARY KEY NOT NULL,
            name text NOT NULL,
            type text NOT NULL,
            icon text DEFAULT '💳' NOT NULL,
            enabled integer DEFAULT 1,
            created_at integer DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('✓ Created payment_methods table');

    // Create payment_variants table if not exists
    db.run(`
        CREATE TABLE IF NOT EXISTS payment_variants (
            id text PRIMARY KEY NOT NULL,
            method_id text NOT NULL,
            name text NOT NULL,
            account_number text,
            account_holder text,
            enabled integer DEFAULT 1,
            created_at integer DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (method_id) REFERENCES payment_methods(id) ON UPDATE no action ON DELETE no action
        );
    `);
    console.log('✓ Created payment_variants table');

    // Add columns to sale_payments if they don't exist
    const columns = db.query(`PRAGMA table_info(sale_payments)`).all() as any[];
    const columnNames = columns.map((c: any) => c.name);

    if (!columnNames.includes('method_id')) {
        db.run(`ALTER TABLE sale_payments ADD COLUMN method_id text REFERENCES payment_methods(id);`);
        console.log('✓ Added method_id column');
    }

    if (!columnNames.includes('variant_name')) {
        db.run(`ALTER TABLE sale_payments ADD COLUMN variant_name text;`);
        console.log('✓ Added variant_name column');
    }

    if (!columnNames.includes('variant_id')) {
        db.run(`ALTER TABLE sale_payments ADD COLUMN variant_id text REFERENCES payment_variants(id);`);
        console.log('✓ Added variant_id column');
    }

    // Seed default payment methods if none exist
    const count = db.query('SELECT COUNT(*) as count FROM payment_methods').get() as any;
    if (count.count === 0) {
        db.run(`
            INSERT INTO payment_methods (id, name, type, icon, enabled) VALUES
            ('PM-cash', 'Tunai', 'cash', '💵', 1),
            ('PM-transfer', 'Transfer Bank', 'transfer', '🏦', 1),
            ('PM-qris', 'QRIS', 'qris', '📱', 1);
        `);
        console.log('✓ Seeded default payment methods');
    } else {
        console.log('⊘ Payment methods already exist, skipping seed');
    }

    console.log('\n✅ Migration completed successfully!');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
} finally {
    // Re-enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    db.close();
}
