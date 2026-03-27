import js from '@eslint/js'
import globals from 'globals'
import nextVitals from 'eslint-config-next/core-web-vitals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['.next', 'dist', 'playwright-report', 'coverage', 'test-results']),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals,
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2024,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
])
