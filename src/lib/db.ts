import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

/**
 * Vercel's serverless functions have a read-only filesystem outside of
 * /tmp, and /tmp itself is ephemeral (wiped between deployments, and not
 * shared across function instances). This picks a writable directory so
 * the app doesn't crash there, but on Vercel the data in reconciliations/
 * appointments/call_logs will NOT persist reliably — swap this for a real
 * hosted database (Postgres, Turso, etc.) before relying on it in
 * production.
 */
function resolveDataDir(): string {
  const preferred = path.join(process.cwd(), "data");
  try {
    fs.mkdirSync(preferred, { recursive: true });
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch {
    const fallback = path.join(os.tmpdir(), "crrm-data");
    fs.mkdirSync(fallback, { recursive: true });
    return fallback;
  }
}

const DB_PATH = path.join(resolveDataDir(), "app.db");

declare global {
  var __db: Database.Database | undefined;
}

function createDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS reconciliations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_id INTEGER NOT NULL,
      partner_name TEXT NOT NULL,
      invoice_ref TEXT,
      invoice_move_id INTEGER,
      invoice_amount REAL,
      payment_ref TEXT,
      payment_id INTEGER,
      payment_amount REAL,
      matched_amount REAL NOT NULL,
      reconciliation_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      confirmed_by TEXT,
      confirmed_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_id INTEGER NOT NULL,
      partner_name TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      purpose TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      assigned_to TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_id INTEGER NOT NULL,
      partner_name TEXT NOT NULL,
      appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
      call_date TEXT NOT NULL DEFAULT (datetime('now')),
      outcome TEXT NOT NULL,
      notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export function getDb(): Database.Database {
  if (!globalThis.__db) {
    globalThis.__db = createDb();
  }
  return globalThis.__db;
}
