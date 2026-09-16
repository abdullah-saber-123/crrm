import { Pool } from "pg";

/**
 * App-owned state (reconciliation confirmations, appointments, collection
 * shows, nominations, registrations) lives in Postgres — not in Odoo, and
 * not in a local SQLite file, since serverless platforms like Vercel don't
 * offer a persistent local filesystem across requests/instances.
 *
 * Point POSTGRES_URL (or DATABASE_URL) at any Postgres instance — Vercel
 * Postgres (Storage tab → Create Database → Postgres, auto-connected),
 * Neon, Supabase, or a local Postgres for development.
 */

declare global {
  var __pgPool: Pool | undefined;
  var __schemaReady: Promise<void> | undefined;
}

function getConnectionString(): string {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "No Postgres connection string configured. Set POSTGRES_URL or DATABASE_URL " +
        "(e.g. by adding a Postgres database to this project under Vercel's Storage tab)."
    );
  }
  return url;
}

function getPool(): Pool {
  if (!globalThis.__pgPool) {
    globalThis.__pgPool = new Pool({
      connectionString: getConnectionString(),
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalThis.__pgPool;
}

async function ensureSchema(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS account_reconciliations (
      id SERIAL PRIMARY KEY,
      partner_id INTEGER NOT NULL,
      partner_name TEXT NOT NULL,
      as_of_date DATE NOT NULL,
      balance NUMERIC NOT NULL,
      total_invoiced NUMERIC NOT NULL,
      total_paid NUMERIC NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      confirmed_by TEXT,
      confirmed_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      partner_id INTEGER NOT NULL,
      partner_name TEXT NOT NULL,
      scheduled_at TIMESTAMPTZ NOT NULL,
      purpose TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      assigned_to TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS collection_shows (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      event_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS nominations (
      id SERIAL PRIMARY KEY,
      show_id INTEGER NOT NULL REFERENCES collection_shows(id) ON DELETE CASCADE,
      partner_id INTEGER NOT NULL,
      partner_name TEXT NOT NULL,
      nominated_by TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id SERIAL PRIMARY KEY,
      show_id INTEGER NOT NULL REFERENCES collection_shows(id) ON DELETE CASCADE,
      partner_id INTEGER NOT NULL,
      partner_name TEXT NOT NULL,
      registered_by TEXT,
      registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(show_id, partner_id)
    );
  `);
}

export async function getDb(): Promise<Pool> {
  const pool = getPool();
  if (!globalThis.__schemaReady) {
    globalThis.__schemaReady = ensureSchema(pool);
  }
  await globalThis.__schemaReady;
  return pool;
}
