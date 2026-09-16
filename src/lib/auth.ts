import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { findUserByUsername, verifyPassword, type Role } from "@/lib/users-repo";

/**
 * DB-backed users (Postgres) with roles, plus a fixed env-var admin as a
 * permanent bootstrap/break-glass account (so there's always a way in even
 * before any DB user exists, and even if the database is briefly down).
 * The session itself stays a signed cookie — no server-side session table —
 * with the user's identity and role embedded in the signed payload.
 */

const SESSION_COOKIE = "crrm_session";
const SESSION_DAYS = 7;

export type SessionUser = {
  id: number;
  name: string;
  username: string;
  role: Role;
};

function getSecret(): string {
  return process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";
}

function getBootstrapAdmin(): { username: string; password: string } {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "123",
  };
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  return a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Verifies credentials against DB users first, then the env-var bootstrap
 * admin. Returns the authenticated identity, or null.
 */
export async function checkCredentials(
  username: string,
  password: string
): Promise<{ id: number; username: string; name: string; role: Role } | null> {
  try {
    const dbUser = await findUserByUsername(username);
    if (dbUser && verifyPassword(password, dbUser.passwordHash)) {
      return { id: dbUser.id, username: dbUser.username, name: dbUser.name, role: dbUser.role };
    }
  } catch (err) {
    // The DB lookup must never block the bootstrap admin below — that
    // account exists specifically so a DB outage can't lock everyone out.
    console.error("checkCredentials: DB lookup failed, falling back to bootstrap admin only", err);
  }

  const bootstrap = getBootstrapAdmin();
  if (timingSafeStringEqual(username, bootstrap.username) && timingSafeStringEqual(password, bootstrap.password)) {
    return { id: 0, username: bootstrap.username, name: bootstrap.username, role: "admin" };
  }

  return null;
}

export function createSessionToken(user: { id: number; username: string; name: string; role: Role }): string {
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ ...user, exp: expiresAt })).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function verifySessionToken(token: string): SessionUser | null {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expected = sign(payload);
    if (signature.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (Date.now() > data.exp) return null;

    return { id: data.id, username: data.username, name: data.name, role: data.role };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;
