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
 * Attempt to fix the DATABASE_URL for Supabase Transaction Pooler.
 * The pooler requires the username in `postgres.{project_ref}` format.
 * If the URL has plain `postgres`, auto-inject the project ref.
 */
function buildConnectionString(raw: string): string {
  try {
    const decoded = raw.replace(/%40/g, "@").replace(/%23/g, "#");
    const url = new URL(decoded);

    if (url.hostname.includes("pooler.supabase.com") && !url.username.includes(".")) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
        if (projectRef) {
          const encodedPass = encodeURIComponent(decodeURIComponent(url.password));
          return `postgresql://${url.username}.${projectRef}:${encodedPass}@${url.hostname}:${url.port || 5432}${url.pathname}`;
        }
      }
    }

    // Try direct connection format if pooler is failing
    // db.{project_ref}.supabase.co:5432 doesn't need project ref in username
    return raw;
  } catch {
    return raw;
  }
}

export function createDatabaseClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  const fixedUrl = buildConnectionString(connectionString);

  let client: ReturnType<typeof postgres>;
  try {
    const decoded = fixedUrl.replace(/%40/g, "@").replace(/%23/g, "#");
    const url = new URL(decoded);

    // Always pass explicit params to avoid postgres.js DNS bug with dotted usernames
    client = postgres({
      host:            url.hostname,
      port:            parseInt(url.port) || 5432,
      database:        url.pathname.slice(1) || "postgres",
      user:            decodeURIComponent(url.username),
      password:        decodeURIComponent(url.password),
      ssl:             { rejectUnauthorized: false },
      prepare:         false,
      max:             5,
      idle_timeout:    20,
      connect_timeout: 15,
    });
  } catch {
    client = postgres(connectionString, {
      prepare: false, max: 5, ssl: { rejectUnauthorized: false },
    });
  }

  return drizzle(client, { schema });
}

let _drizzle: Database | null = null;

export function getDb(): Database {
  if (!_drizzle) {
    _drizzle = createDatabaseClient();
  }
  return _drizzle;
}
