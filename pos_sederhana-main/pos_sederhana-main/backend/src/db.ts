import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', '..', 'pos_records.db');

export const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_no TEXT UNIQUE,
    customer_name TEXT,
    cashier_name TEXT,
    total REAL,
    cash_paid REAL,
    change_amount REAL,
    amount_due REAL,
    payment_method TEXT,
    status TEXT, -- 'LUNAS', 'BELUM_LUNAS'
    items_json TEXT,
    device_info TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS debt_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
  );

  CREATE TABLE IF NOT EXISTS devices (
    device_id TEXT PRIMARY KEY,
    name TEXT DEFAULT 'Majmu Service',
    last_ip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invites (
    pairing_token TEXT PRIMARY KEY,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add new columns if they don't exist
const addColumn = (table: string, column: string, type: string, defaultValue?: string) => {
    try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type} ${defaultValue ? `DEFAULT ${defaultValue}` : ''}`);
        console.log(`✅ Added column ${column} to table ${table}`);
    } catch (e: unknown) {
        if (e instanceof Error && !e.message.includes('duplicate column name')) {
            console.error(`❌ Error adding column ${column}:`, e.message);
        }
    }
};

addColumn('devices', 'metadata', 'TEXT');
addColumn('devices', 'is_blocked', 'INTEGER', '0');
addColumn('devices', 'is_active', 'INTEGER', '1');
addColumn('devices', 'pairing_token', 'TEXT');

// Migration untuk Tabel Invites (Pendaftaran Step-by-Step)
addColumn('invites', 'claiming_device_id', 'TEXT');
addColumn('invites', 'claiming_metadata', 'TEXT');
addColumn('invites', 'claiming_ip', 'TEXT');

// Ensure ADMIN-PC exists for Desktop Transactions
db.prepare(`
    INSERT OR IGNORE INTO devices (device_id, name, is_active, is_blocked, metadata) 
    VALUES ('ADMIN-PC', 'NEW MAJMU Service', 1, 0, 'Sistem Utama (Desktop)')
`).run();

console.log('✅ Database POS initialized at:', dbPath);
