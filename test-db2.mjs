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

const raw = env.DATABASE_URL || '';
const decoded = raw.replace(/%40/g, '@').replace(/%23/g, '#');
let url;
try { url = new URL(decoded); } catch { console.error('Bad DATABASE_URL'); process.exit(1); }

console.log('Host:    ', url.hostname);
console.log('Username:', url.username);
console.log('Has dot: ', url.username.includes('.'));

const sql = postgres({
  host: url.hostname,
  port: parseInt(url.port) || 5432,
  database: url.pathname.slice(1) || 'postgres',
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  ssl: { rejectUnauthorized: false },
  prepare: false,
  max: 1,
  connect_timeout: 15,
});

try {
  const rows = await sql`SELECT id, slug FROM organizations WHERE deleted_at IS NULL LIMIT 1`;
  console.log('\n✓ Connection works!');
  console.log('  Org found:', rows[0]);
} catch (e) {
  console.error('\n✗ Query failed:', e.message);
  console.error('  Code:', e.code);
} finally {
  await sql.end({ timeout: 3 });
}
