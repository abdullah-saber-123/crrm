import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";

export type Role = "admin" | "agent";

export type AppUser = {
  id: number;
  username: string;
  name: string;
  role: Role;
  createdAt: string;
};

function rowToUser(row: Record<string, unknown>): AppUser {
  return {
    id: row.id as number,
    username: row.username as string,
    name: row.name as string,
    role: row.role as Role,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export async function listUsers(): Promise<AppUser[]> {
  const db = await getDb();
  const { rows } = await db.query("SELECT * FROM users ORDER BY created_at ASC");
  return rows.map(rowToUser);
}

export async function findUserByUsername(
  username: string
): Promise<(AppUser & { passwordHash: string }) | undefined> {
  const db = await getDb();
  const { rows } = await db.query("SELECT * FROM users WHERE username = $1", [username]);
  if (!rows[0]) return undefined;
  return { ...rowToUser(rows[0]), passwordHash: rows[0].password_hash as string };
}

export async function createUser(input: {
  username: string;
  name: string;
  password: string;
  role: Role;
}): Promise<AppUser> {
  const db = await getDb();
  const { rows } = await db.query(
    `INSERT INTO users (username, name, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.username, input.name, hashPassword(input.password), input.role]
  );
  return rowToUser(rows[0]);
}

export async function deleteUser(id: number): Promise<void> {
  const db = await getDb();
  await db.query("DELETE FROM users WHERE id = $1", [id]);
}
