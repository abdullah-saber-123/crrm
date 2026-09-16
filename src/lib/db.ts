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
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'agent',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

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
      status TEXT NOT NULL DEFAULT 'open',
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

    CREATE TABLE IF NOT EXISTS nominee_batches (
      id SERIAL PRIMARY KEY,
      show_id INTEGER NOT NULL REFERENCES collection_shows(id) ON DELETE CASCADE,
      partner_id INTEGER NOT NULL,
      batch INTEGER NOT NULL DEFAULT 1,
      updated_by TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(show_id, partner_id)
    );
  `);

  // status column added after collection_shows already existed in earlier
  // deployments — ADD COLUMN IF NOT EXISTS is natively idempotent.
  await pool.query(`
    ALTER TABLE collection_shows ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
  `);

  // One nomination per (show, customer, user) — added after nominations
  // already existed in earlier deployments, so first collapse any
  // duplicates already on file (keep the earliest row), then apply the
  // constraint idempotently.
  await pool.query(`
    DELETE FROM nominations a USING nominations b
    WHERE a.id > b.id
      AND a.show_id = b.show_id
      AND a.partner_id = b.partner_id
      AND a.nominated_by IS NOT DISTINCT FROM b.nominated_by;
  `);
  // Check information_schema first rather than relying on catching a
  // specific exception class — Postgres raises different error codes here
  // depending on why the constraint already exists (duplicate_object vs.
  // duplicate_table for its backing index), so guessing which one to catch
  // is fragile.
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'nominations'
          AND constraint_name = 'nominations_show_partner_user_unique'
      ) THEN
        ALTER TABLE nominations
          ADD CONSTRAINT nominations_show_partner_user_unique UNIQUE (show_id, partner_id, nominated_by);
      END IF;
    END $$;
  `);
}

export async function getDb(): Promise<Pool> {
  const pool = getPool();
  if (!globalThis.__schemaReady) {
    globalThis.__schemaReady = ensureSchema(pool).catch((err) => {
      // Don't cache a failed migration forever — the next call should
      // retry rather than fail permanently until the process restarts.
      globalThis.__schemaReady = undefined;
      throw err;
    });
  }
  await globalThis.__schemaReady;
  return pool;
}
