import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.E2E_PORT ?? '4174')
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`
const useExternalServer = process.env.E2E_EXTERNAL_SERVER === '1'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: useExternalServer
    ? undefined
    : {
        command: `npm run preview -- --host 127.0.0.1 --port ${port}`,
        port,
        reuseExistingServer: false,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
