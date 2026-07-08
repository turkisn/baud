import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const tailwindConfig = require('./tailwind.config.cjs')

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        require('tailwindcss')(tailwindConfig),
        require('autoprefixer')(),
      ],
    },
  },
})
