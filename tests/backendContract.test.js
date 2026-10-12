import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationPath = path.join(
  root,
  'supabase',
  'migrations',
  '20261012165202_close_backend_security_contract.sql',
);

const adminFunctions = [
  'admin_log_action',
  'admin_register_mvp_product_file',
  'admin_save_mvp_product',
  'admin_save_mvp_supplier',
  'admin_set_user_role',
  'admin_verify_entity',
];

test('elevated admin implementations stay behind invoker API facades', async () => {
  const sql = await readFile(migrationPath, 'utf8');

  for (const functionName of adminFunctions) {
    assert.match(
      sql,
      new RegExp(`alter function public\\.${functionName}\\([\\s\\S]*?set schema private;`),
      `${functionName} must be moved out of the exposed schema`,
    );
    assert.match(
      sql,
      new RegExp(`create function public\\.${functionName}\\([\\s\\S]*?security invoker[\\s\\S]*?private\\.${functionName}\\(`),
      `${functionName} must expose only a SECURITY INVOKER facade`,
    );
  }
});

test('future database objects remain deny-by-default', async () => {
  const sql = await readFile(migrationPath, 'utf8');

  assert.match(sql, /alter default privileges for role postgres in schema public[\s\S]*?on tables from anon, authenticated, service_role;/);
  assert.match(sql, /alter default privileges for role postgres in schema public[\s\S]*?on sequences from anon, authenticated, service_role;/);
  assert.match(sql, /alter default privileges for role postgres in schema public[\s\S]*?on functions from public, anon, authenticated, service_role;/);
  assert.match(sql, /alter default privileges for role postgres in schema private[\s\S]*?on functions from public, anon, authenticated, service_role;/);
});

test('browser source never contains a Supabase service-role credential', async () => {
  const sourceRoot = path.join(root, 'src');
  const pending = [sourceRoot];
  const forbidden = /service[_-]?role|supabase[_-]?service|serviceRole/i;

  while (pending.length > 0) {
    const directory = pending.pop();
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        pending.push(target);
      } else if (/\.(?:js|jsx|ts|tsx)$/.test(entry.name)) {
        assert.doesNotMatch(
          await readFile(target, 'utf8'),
          forbidden,
          `${path.relative(root, target)} references a privileged Supabase credential`,
        );
      }
    }
  }
});
