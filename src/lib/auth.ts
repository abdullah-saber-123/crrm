import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

const SESSION_COOKIE = "crrm_session";
const SESSION_DAYS = 7;

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

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

export function createSession(userId: number): string {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  getDb()
    .prepare(
      "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)"
    )
    .run(token, userId, expiresAt.toISOString());
  return token;
}

export function destroySession(token: string): void {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = getDb()
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, s.expires_at as expiresAt
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token) as
    | { id: number; name: string; email: string; role: string; expiresAt: string }
    | undefined;

  if (!row) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    destroySession(token);
    return null;
  }
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
