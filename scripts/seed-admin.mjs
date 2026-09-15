import Database from "better-sqlite3";
import { scryptSync, randomBytes } from "node:crypto";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, "app.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const email = process.env.SEED_ADMIN_EMAIL || "admin";
const password = process.env.SEED_ADMIN_PASSWORD || "123";
const name = process.env.SEED_ADMIN_NAME || "Administrator";

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
const passwordHash = `${salt}:${hash}`;

const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
if (existing) {
  db.prepare("UPDATE users SET password_hash = ?, name = ? WHERE email = ?").run(
    passwordHash,
    name,
    email
  );
  console.log(`Updated existing admin user: ${email}`);
} else {
  db.prepare(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')"
  ).run(name, email, passwordHash);
  console.log(`Created admin user: ${email} / ${password}`);
}
