import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: [
    'dist',
    'src/components/BlockCard.jsx',
    'src/components/Navbar.jsx',
    'src/components/ProductRender.jsx',
    'src/pages/About.jsx',
    'src/pages/AIBQO.jsx',
    'src/pages/BlockDetails.jsx',
    'src/pages/Contact.jsx',
    'src/pages/Dashboard.jsx',
    'src/pages/DashboardRouter.jsx',
    'src/pages/Designers.jsx',
    'src/pages/Library.jsx',
    'src/pages/LibraryAdmin.jsx',
    'src/pages/LibraryDetail.jsx',
    'src/pages/Marketplace.jsx',
    'src/pages/Pricing.jsx',
    'src/pages/SupplierDashboard.jsx',
    'src/pages/UserDashboard.jsx',
    'src/pages/products/**',
    'src/data/mockData.js',
    'src/services/productService.js',
    'src/services/productsService.js',
  ] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]
