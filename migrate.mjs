import postgres from 'postgres';
import fs from 'fs';

async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  const migration = fs.readFileSync('supabase/migrations/20260517_000002_add_vector.sql', 'utf8');
  await sql.unsafe(migration);
  console.log('Migration completed successfully.');
  process.exit(0);
}

run().catch(console.error);
