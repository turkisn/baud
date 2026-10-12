import { defineConfig } from '@playwright/test';
import process from 'node:process';
import path from 'node:path';
import base from './playwright.config.js';

if (process.env.BUOD_BROWSER_FIXTURES !== '1' || !path.isAbsolute(process.env.BUOD_VISUAL_BASELINE || '')) {
  throw new Error('Set BUOD_BROWSER_FIXTURES=1 and an absolute BUOD_VISUAL_BASELINE directory');
}
if (process.env.BUOD_PREVIEW_ACCESS_URL) throw new Error('Visual fixtures are local only');
export default defineConfig(base, {
  testDir: './tests/visual',
  snapshotPathTemplate: process.env.BUOD_VISUAL_BASELINE + '/{arg}{ext}',
  outputDir: 'test-results/visual',
  use: { ...base.use, reducedMotion: 'reduce', trace: 'off' },
});
