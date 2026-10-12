import { defineConfig } from '@playwright/test';
import process from 'node:process';
import base from './playwright.config.js';

if (process.env.BUOD_BROWSER_FIXTURES !== '1' || process.env.BUOD_PREVIEW_ACCESS_URL) {
  throw new Error('Additional acceptance runs require local synthetic fixtures');
}
export default defineConfig(base, {
  testDir: './tests/acceptance',
  outputDir: 'test-results/acceptance',
  use: { ...base.use, reducedMotion: 'reduce' },
});
