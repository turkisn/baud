import { defineConfig } from '@playwright/test';
import process from 'node:process';

const deployedPreview = Boolean(process.env.BUOD_PREVIEW_ACCESS_URL);
const stagingURL = 'https://baud-git-staging-baud1.vercel.app';
if (deployedPreview && (process.env.BUOD_LIVE_STAGING !== '1'
  || new URL(process.env.BUOD_PREVIEW_ACCESS_URL).origin !== stagingURL)) {
  throw new Error('Remote browser checks require explicit BUOD staging opt-in');
}

export default defineConfig({
  testDir: './tests/browser',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: deployedPreview ? stagingURL : 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    // A remote preview authorization URL must never land in a trace artifact.
    trace: deployedPreview ? 'off' : 'retain-on-failure',
    launchOptions: process.platform === 'darwin' ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' } : {},
  },
  webServer: deployedPreview ? undefined : {
    env: process.env.BUOD_BROWSER_FIXTURES === '1' ? {
      VITE_SUPABASE_URL: 'https://workspace-fixture.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture_not_a_real_key',
    } : {},
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
