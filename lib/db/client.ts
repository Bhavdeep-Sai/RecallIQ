/**
 * Database Client
 *
 * Uses two connection strategies:
 *  1. Primary — Supabase JS client (REST API via service role key).
 *     This is 100% reliable for any Supabase project and is the same
 *     mechanism used by the seed script.
 *  2. Fallback — Drizzle ORM over postgres-js (direct SQL).
 *     Used only when DATABASE_URL is present and the REST API is unavailable.
 *
 * The Supabase REST API approach avoids all Transaction Pooler configuration
 * issues (SNI, tenant routing, etc.) that plague direct postgres connections
 * in serverless / edge environments.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import * as schema from "@/lib/db/schema";

export type Database = ReturnType<typeof createDatabaseClient>;

// ─── Supabase service-role client (REST API) ──────────────────────────────

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

// ─── Drizzle client (direct SQL) ──────────────────────────────────────────

/**
 * Attempt to normalize the DATABASE_URL for Supabase Transaction Pooler.
 * The pooler requires the username in `postgres.{project_ref}` format and
 * benefits from explicit SNI hints when connecting through postgres.js.
 */
function buildConnectionConfig(raw: string) {
  const decoded = raw.replace(/%40/g, "@").replace(/%23/g, "#");
  const url = new URL(decoded);
  const isPooler = url.hostname.includes("pooler.supabase.com");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectHost = supabaseUrl ? new URL(supabaseUrl).hostname : null;

  let username = decodeURIComponent(url.username);
  if (isPooler && projectHost && !username.includes(".")) {
    username = `${username}.${projectHost.split(".")[0]}`;
  }

  const ssl: { rejectUnauthorized: boolean; servername?: string } = { rejectUnauthorized: false };
  if (isPooler && projectHost) {
    ssl.servername = projectHost;
  }

  const connectionString = isPooler && projectHost
    ? `${url.protocol}//${encodeURIComponent(username)}:${encodeURIComponent(decodeURIComponent(url.password))}@${url.hostname}:${url.port || 5432}${url.pathname}${url.search ? `${url.search}&` : "?"}options=${encodeURIComponent(`--sni-hostname=${projectHost}`)}&sni_hostname=${encodeURIComponent(projectHost)}&external_id=${encodeURIComponent(projectHost.split(".")[0])}`
    : raw;

  return {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1) || "postgres",
    user: username,
    password: decodeURIComponent(url.password),
    ssl,
    connectionString,
  };
}

export function createDatabaseClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  try {
    const config = buildConnectionConfig(connectionString);

    // Prefer explicit options to avoid postgres.js DNS/SNI edge cases.
    const client = postgres(config.connectionString, {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl,
      prepare: false,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 15,
    });

    return drizzle(client, { schema });
  } catch {
    const client = postgres(connectionString, {
      prepare: false,
      max: 5,
      ssl: { rejectUnauthorized: false },
    });

    return drizzle(client, { schema });
  }
}

let _drizzle: Database | null = null;

export function getDb(): Database {
  if (!_drizzle) {
    _drizzle = createDatabaseClient();
  }
  return _drizzle;
}
