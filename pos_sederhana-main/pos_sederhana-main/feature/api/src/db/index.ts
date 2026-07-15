import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';

// Buat atau hubungkan ke pos.db di direktori feature/api
const dbPath = path.resolve(process.cwd(), 'pos_v2.db');
const sqlite = new Database(dbPath);

// Kita buat PRAGMA untuk optimasi kecepatan SQLite
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite);
