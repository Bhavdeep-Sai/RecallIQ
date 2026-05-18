import postgres from 'postgres';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const raw = env.DATABASE_URL;
const decoded = raw.replace(/%40/g, '@').replace(/%23/g, '#');
const url = new URL(decoded);

// project host from env if present (used for SNI when connecting to Supabase pooler)
const projectHost = env.NEXT_PUBLIC_SUPABASE_URL ? new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;

console.log('Host:    ', url.hostname);
console.log('Port:    ', url.port);
console.log('User:    ', decodeURIComponent(url.username));
console.log('DB:      ', url.pathname.slice(1));

// Same fix as lib/db/client.ts — pass explicit options to avoid dot-in-username DNS bug
const sslOptions = { rejectUnauthorized: false };
if (projectHost && url.hostname.includes('pooler.supabase.com')) sslOptions.servername = projectHost;

// Build connection string with options SNI when needed
let connectionStringToUse = raw;
if (projectHost && url.hostname.includes('pooler.supabase.com')) {
  const projectRef = projectHost.split('.')[0];
  const sep = raw.includes('?') ? '&' : '?';
  const params = [];
  params.push('options=' + encodeURIComponent('--sni-hostname=' + projectHost));
  params.push('sni_hostname=' + encodeURIComponent(projectHost));
  params.push('external_id=' + encodeURIComponent(projectRef));
  connectionStringToUse = raw + sep + params.join('&');
}

const sql = postgres(connectionStringToUse, {
  prepare: false,
  max: 1,
  connect_timeout: 15,
  ssl: sslOptions,
});

try {
  const [r] = await sql`SELECT current_database() as db, current_user as usr`;
  console.log('\n✓ Connected — db:', r.db, '| user:', r.usr);

  const tables = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  console.log(`✓ ${tables.length} tables found:`);
  tables.forEach(t => console.log('  -', t.tablename));
} catch (e) {
  console.error('\n✗ Connection failed:', e.message);
  if (e.code) console.error('  Code:', e.code);
} finally {
  await sql.end();
}
