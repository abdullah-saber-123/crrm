import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

/**
 * Vercel's serverless functions have a read-only filesystem outside of
 * /tmp, and /tmp itself is ephemeral (wiped between deployments, and not
 * shared across function instances). This picks a writable directory so
 * the app doesn't crash there, but on Vercel the data in reconciliations/
 * shows/nominations/appointments will NOT persist reliably — swap this for
 * a real hosted database (Postgres, Turso, etc.) before relying on it in
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
    -- Account-level reconciliation: confirms a customer's balance as of a
    -- given date (not a per-invoice/payment match).
    CREATE TABLE IF NOT EXISTS account_reconciliations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_id INTEGER NOT NULL,
      partner_name TEXT NOT NULL,
      as_of_date TEXT NOT NULL,
      balance REAL NOT NULL,
      total_invoiced REAL NOT NULL,
      total_paid REAL NOT NULL,
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

    -- Collection show: a "new collection" showcase event customers can be
    -- nominated for and registered into.
    CREATE TABLE IF NOT EXISTS collection_shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      event_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Each row is one nomination by one staff member; a customer can be
    -- nominated multiple times (by the same or different staff) — the
    -- nomination count is simply the number of rows for that show+partner.
    CREATE TABLE IF NOT EXISTS nominations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      show_id INTEGER NOT NULL REFERENCES collection_shows(id) ON DELETE CASCADE,
      partner_id INTEGER NOT NULL,
      partner_name TEXT NOT NULL,
      nominated_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Registration is a single yes/no state per (show, partner).
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      show_id INTEGER NOT NULL REFERENCES collection_shows(id) ON DELETE CASCADE,
      partner_id INTEGER NOT NULL,
      partner_name TEXT NOT NULL,
      registered_by TEXT,
      registered_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(show_id, partner_id)
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
