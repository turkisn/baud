import process from 'node:process';
import { loadEnv } from 'vite';
import { validateReleaseConfig } from '../src/utils/releaseConfig.js';
const errors = validateReleaseConfig({ ...loadEnv('production', process.cwd(), ''), ...process.env }, true);
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else console.log('Production public configuration passed. Operator, legal, email and database approval remain separate gates.');
