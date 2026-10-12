import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'

import { validateReleaseConfig } from './src/utils/releaseConfig.js'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const production = env.VERCEL_ENV === 'production' || env.VITE_APP_ENV === 'production'
  const errors = validateReleaseConfig(env, production)
  if (errors.length) throw new Error(errors.join('\n'))
  const deploymentEnvironment = (production ? 'production' : '') || env.VITE_APP_ENV
    || (process.env.VERCEL_GIT_COMMIT_REF === 'staging' ? 'staging' : '')
    || process.env.VERCEL_ENV
    || mode

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_BUOD_ENV': JSON.stringify(deploymentEnvironment),
    },
  }
})
