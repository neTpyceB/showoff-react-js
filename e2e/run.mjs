import assert from 'node:assert/strict'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import AxeBuilder from '@axe-core/playwright'
import { chromium } from 'playwright'

const port = Number(process.env.E2E_PORT ?? '4174')
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`

const waitForServer = async (url, timeoutMs = 30_000) => {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${url}/api/healthz`)

      if (response.ok) {
        return
      }
    } catch {
      await delay(250)
      continue
    }

    await delay(250)
  }

  throw new Error(`Timed out waiting for ${url}.`)
}

const assertVisible = async (locator, message) => {
  await locator.waitFor({ state: 'visible', timeout: 15_000 })
  assert.equal(await locator.isVisible(), true, message)
}

const browser = await chromium.launch({ headless: true })

const createPage = async () => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  })

  return {
    context,
    page: await context.newPage(),
  }
}

const loginAs = async (page, firstName) => {
  await page.goto(`${baseURL}/login`)
  await page.getByRole('button', { name: `Sign in as ${firstName}` }).click()
  await page.waitForURL(/\/orgs\/[^/]+(\/overview)?$/)
}

const runAccessibilityScenario = async () => {
  const { context, page } = await createPage()

  try {
    await page.goto(`${baseURL}/login`)
    await assertVisible(page.getByText('Sign in as Olivia'), 'Login page should render.')

    const scan = await new AxeBuilder({ page }).analyze()
    assert.deepEqual(scan.violations, [], 'Accessibility violations found on login.')
  } finally {
    await context.close()
  }
}

const runOwnerScenario = async () => {
  const { context, page } = await createPage()

  try {
    await page.goto(`${baseURL}/orgs/org-acme/members`)
    await page.waitForURL(/\/login$/)
    await loginAs(page, 'Olivia')

    await assertVisible(page.getByRole('heading', { name: /acme cloud overview/i }), 'Owner overview should load.')

    await page.goto(`${baseURL}/orgs/org-acme/members`)
    const noahRow = page.getByRole('row').filter({ has: page.getByText('Noah Park') })
    await page.getByLabel('Role for Noah Park').selectOption('manager')
    await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/orgs/org-acme/members/user-noah') && response.request().method() === 'PATCH'),
      noahRow.getByRole('button', { name: 'Save role' }).click(),
    ])
    await assertVisible(page.getByText('Role updated'), 'Role update toast should appear.')

    await page.goto(`${baseURL}/orgs/org-acme/billing`)
    await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/orgs/org-acme/billing') && response.request().method() === 'PATCH'),
      page.getByRole('button', { name: 'Set enterprise' }).click(),
    ])
    await assertVisible(page.getByText('enterprise plan · active'), 'Billing plan should update to enterprise.')

    await page.goto(`${baseURL}/orgs/org-acme/flags`)
    const pluginCenterCard = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Plugin center' }) })
    await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/orgs/org-acme/flags/pluginCenter') && response.request().method() === 'PATCH'),
      pluginCenterCard.getByRole('button', { name: 'Enable' }).click(),
    ])
    await assertVisible(page.getByText('Plugin center is now enabled.'), 'Flag update toast should appear.')

    await page.goto(`${baseURL}/orgs/org-acme/plugins`)
    const insightsCard = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Workload Insights' }) })
    await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/orgs/org-acme/plugins/plugin-insights') && response.request().method() === 'PATCH'),
      insightsCard.getByRole('button', { name: 'Enable' }).click(),
    ])
    await assertVisible(page.getByText('Workload Insights is now enabled.'), 'Plugin update toast should appear.')

    await page.goto(`${baseURL}/orgs/org-acme/audit`)
    await assertVisible(page.getByText('member.role_updated'), 'Audit log should contain role mutation.')
    await assertVisible(page.getByText('plugin.updated'), 'Audit log should contain plugin mutation.')

    await page.getByLabel('Organization switcher').selectOption('org-northstar')
    await page.waitForURL(/\/orgs\/org-northstar\/overview$/)
    await assertVisible(page.getByRole('heading', { name: /northstar os overview/i }), 'Org switcher should navigate to the selected org.')
  } finally {
    await context.close()
  }
}

const runViewerScenario = async () => {
  const { context, page } = await createPage()

  try {
    await loginAs(page, 'Noah')
    await assertVisible(page.getByRole('heading', { name: /acme cloud overview/i }), 'Viewer overview should load.')
    await page.goto(`${baseURL}/orgs/org-acme/billing`)
    await assertVisible(page.getByRole('heading', { name: 'Access denied' }), 'Viewer should be denied billing access.')
  } finally {
    await context.close()
  }
}

await waitForServer(baseURL)

try {
  await runAccessibilityScenario()
  await runOwnerScenario()
  await runViewerScenario()
} finally {
  await browser.close()
}
