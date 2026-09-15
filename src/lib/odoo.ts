/**
 * Minimal Odoo JSON-RPC client (external API: /jsonrpc).
 * Docs: https://www.odoo.com/documentation/latest/developer/reference/external_api.html
 *
 * Configure via env vars:
 *   ODOO_URL       e.g. https://mycompany.odoo.com
 *   ODOO_DB        database name
 *   ODOO_USERNAME  login (email)
 *   ODOO_API_KEY   API key or password
 *
 * When these are not set, callers fall back to the demo fixtures in
 * odoo-demo-data.ts so the app is usable without a live Odoo instance.
 */

export type OdooDomain = Array<unknown>;

type JsonRpcRequest = {
  jsonrpc: "2.0";
  method: "call";
  params: Record<string, unknown>;
  id: number;
};

let cachedUid: number | null = null;

export function isOdooConfigured(): boolean {
  return Boolean(
    process.env.ODOO_URL &&
      process.env.ODOO_DB &&
      process.env.ODOO_USERNAME &&
      process.env.ODOO_API_KEY
  );
}

async function jsonRpc<T>(endpoint: string, params: Record<string, unknown>): Promise<T> {
  const url = `${process.env.ODOO_URL!.replace(/\/$/, "")}${endpoint}`;
  const body: JsonRpcRequest = {
    jsonrpc: "2.0",
    method: "call",
    params,
    id: Math.floor(Math.random() * 1_000_000),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Odoo request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.error) {
    const message = json.error?.data?.message || json.error?.message || "Odoo RPC error";
    throw new Error(message);
  }
  return json.result as T;
}

async function authenticate(): Promise<number> {
  if (cachedUid) return cachedUid;
  const uid = await jsonRpc<number>("/jsonrpc", {
    service: "common",
    method: "login",
    args: [process.env.ODOO_DB, process.env.ODOO_USERNAME, process.env.ODOO_API_KEY],
  });
  if (!uid) throw new Error("Odoo authentication failed: invalid credentials");
  cachedUid = uid;
  return uid;
}

export async function executeKw<T>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  if (!isOdooConfigured()) {
    throw new Error("Odoo is not configured (missing ODOO_URL/ODOO_DB/ODOO_USERNAME/ODOO_API_KEY)");
  }
  const uid = await authenticate();
  return jsonRpc<T>("/jsonrpc", {
    service: "object",
    method: "execute_kw",
    args: [
      process.env.ODOO_DB,
      uid,
      process.env.ODOO_API_KEY,
      model,
      method,
      args,
      kwargs,
    ],
  });
}

export function searchRead<T>(
  model: string,
  domain: OdooDomain,
  fields: string[],
  opts: { limit?: number; offset?: number; order?: string } = {}
): Promise<T[]> {
  return executeKw<T[]>(model, "search_read", [domain, fields], opts);
}
