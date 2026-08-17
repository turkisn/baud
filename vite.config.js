import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'module'
import process from 'node:process'

const require = createRequire(import.meta.url)
const tailwindConfig = require('./tailwind.config.cjs')

export default defineConfig(({ mode }) => {
  const deploymentEnvironment = process.env.VITE_APP_ENV
    || (process.env.VERCEL_GIT_COMMIT_REF === 'staging' ? 'staging' : '')
    || process.env.VERCEL_ENV
    || mode

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_BUOD_ENV': JSON.stringify(deploymentEnvironment),
    },
    css: {
      postcss: {
        plugins: [
          require('tailwindcss')(tailwindConfig),
          require('autoprefixer')(),
        ],
      },
    },
  }
})
