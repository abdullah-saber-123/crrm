import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Stateless, DB-free authentication.
 *
 * Vercel's serverless functions have a read-only filesystem (aside from
 * /tmp, which is ephemeral per-invocation), so a locally-written SQLite
 * users/sessions table cannot work reliably there. Instead, the single
 * admin login is configured via env vars, and the session is a signed
 * cookie (HMAC) — no server-side storage required to authenticate.
 */

const SESSION_COOKIE = "crrm_session";
const SESSION_DAYS = 7;

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

function getSecret(): string {
  return process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";
}

function getAdminCredentials(): { username: string; password: string } {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "123",
  };
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function checkCredentials(username: string, password: string): boolean {
  const admin = getAdminCredentials();
  const userOk = username.length === admin.username.length &&
    timingSafeEqual(Buffer.from(username), Buffer.from(admin.username));
  const passOk = password.length === admin.password.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(admin.password));
  return userOk && passOk;
}

export function createSessionToken(username: string): string {
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${username}.${expiresAt}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

function verifySessionToken(token: string): { username: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [username, expiresAtStr, signature] = decoded.split(".");
    if (!username || !expiresAtStr || !signature) return null;

    const expected = sign(`${username}.${expiresAtStr}`);
    if (signature.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

    if (Date.now() > Number(expiresAtStr)) return null;
    return { username };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session) return null;

  return { id: 1, name: session.username, email: session.username, role: "admin" };
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;
