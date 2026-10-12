import { readFile, readdir } from 'node:fs/promises';
import process from 'node:process';
import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';

// In-memory PostgreSQL only: accepts no URL, credentials or persistent directory.
// Auth/Storage platform tables are minimal fixtures; all application migrations,
// grants, policies, triggers and RPCs execute unchanged. This does not test the
// GoTrue/Storage HTTP services or concurrent database sessions.
const db = await PGlite.create({ extensions: { uuid_ossp, pg_trgm } });
try {
  await db.exec(await readFile(new URL('../supabase/tests/platform_fixture.sql', import.meta.url), 'utf8'));
  const directory = new URL('../supabase/migrations/', import.meta.url);
  const migrations = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort();
  for (const name of migrations) {
    try {
      await db.exec(await readFile(new URL(name, directory), 'utf8'));
      console.log(`PASS migration ${name}`);
    } catch (error) {
      throw new Error(`Migration ${name}: ${error.message}`, { cause: error });
    }
  }
  console.log('Readable tables without RLS:', (await db.query(`select c.relname
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and not c.relrowsecurity
    and (has_table_privilege('anon',c.oid,'SELECT') or has_table_privilege('authenticated',c.oid,'SELECT'))`)).rows);
  for (const name of ['admin_security.sql', 'backend_contract.sql', 'workspace_security.sql', 'launch_security.sql']) {
    const sql = await readFile(new URL(`../supabase/tests/${name}`, import.meta.url), 'utf8');
    // psql's ON_ERROR_STOP is implicit: any rejected exec fails this process.
    const results = await db.exec(sql.replace(/^\\set ON_ERROR_STOP on\s*$/m, ''));
    for (const result of results) {
      for (const row of result.rows) if (row.result) console.log(row.result);
    }
    console.log(`PASS SQL suite ${name}`);
  }
  console.log(`PASS ${migrations.length} migrations and 4 SQL suites on ${(await db.query('select version()')).rows[0].version}`);
  console.log('LIMIT: single connection and synthetic platform tables; full Supabase and multi-session tests remain required.');
} catch (error) {
  console.error(error.message);
  if (error.cause?.where) console.error(error.cause.where);
  if (error.where) console.error(error.where);
  process.exitCode = 1;
} finally {
  await db.close();
}
