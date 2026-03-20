import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          css: true,
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.smoke.test.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'smoke',
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          css: true,
          include: ['src/**/*.smoke.test.{ts,tsx}'],
        },
      },
    ],
  },
})
