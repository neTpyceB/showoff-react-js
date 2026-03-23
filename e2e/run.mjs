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
  await locator.waitFor({ state: 'visible' })
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
}

const runAccessibilityScenario = async () => {
  const { context, page } = await createPage()

  try {
    await page.goto(`${baseURL}/admin`)
    await page.waitForURL(/\/login$/)
    await assertVisible(
      page.getByRole('heading', { name: 'Showoff Electronics' }),
      'Login screen should render.',
    )

    const scan = await new AxeBuilder({ page }).analyze()
    assert.deepEqual(scan.violations, [], 'Accessibility violations found on the login route.')
  } finally {
    await context.close()
  }
}

const runStorefrontScenario = async () => {
  const { context, page } = await createPage()

  try {
    await page.goto(`${baseURL}/account/orders`)
    await page.waitForURL(/\/login$/)
    await loginAs(page, 'Maya')
    await page.waitForURL(/\/account\/orders$/)
    await assertVisible(page.getByText('SO-1001'), 'Customer account orders should be visible.')

    await page.goto(`${baseURL}/catalog?category=phones`)
    await assertVisible(page.getByText('Arc Phone 9'), 'Filtered catalog should render the phone result.')
    await page.goto(`${baseURL}/search?q=Orbit`)
    await assertVisible(page.getByText('Orbit X1 Pro Laptop'), 'Search should return the Orbit laptop.')

    await page.goto(`${baseURL}/catalog/orbit-x1-pro-laptop`)
    await assertVisible(page.getByRole('heading', { name: 'Orbit X1 Pro Laptop' }), 'PDP should render.')
    await page.getByRole('button', { name: 'Add to cart' }).click()
    await page.goto(`${baseURL}/cart`)
    await assertVisible(page.getByText('Orbit X1 Pro Laptop'), 'Cart should include the added product.')

    await page.getByLabel('Quantity for Signal Buds Max').selectOption('2')
    await page.getByPlaceholder('Promo code').fill('WELCOME10')
    await page.getByRole('button', { name: 'Apply' }).click()
    await assertVisible(page.getByText('$2,697.30'), 'Promo-adjusted cart total should render.')

    await page.getByRole('button', { name: 'Proceed to checkout' }).click()
    await page.waitForURL(/\/checkout$/)
    await page.getByRole('button', { name: 'Create checkout session' }).click()
    await page.waitForURL(/\/checkout\/success\?session_id=/)
    await assertVisible(page.getByRole('link', { name: 'View orders' }), 'Checkout success should render the post-purchase CTA.')

    await page.goto(`${baseURL}/account/orders`)
    await assertVisible(page.getByText(/SO-/).first(), 'Orders should remain available after checkout.')
  } finally {
    await context.close()
  }
}

const runAdminScenario = async () => {
  const { context, page } = await createPage()

  try {
    await page.goto(`${baseURL}/admin`)
    await page.waitForURL(/\/login$/)
    await loginAs(page, 'Evan')
    await page.waitForURL(/\/admin$/)
    await assertVisible(page.getByText('Operational commerce dashboard'), 'Admin overview should render.')

    await page.goto(`${baseURL}/admin/products`)
    await page.getByRole('button', { name: 'Toggle merch' }).first().click()
    await assertVisible(page.getByText('Product updated'), 'Admin product updates should toast.')

    await page.goto(`${baseURL}/admin/inventory`)
    await page.getByRole('button', { name: 'Add stock' }).first().click()
    await assertVisible(page.getByText('Operational commerce dashboard'), 'Admin inventory page should stay stable.')

    await page.goto(`${baseURL}/admin/promotions`)
    await page.getByRole('button', { name: 'Create promotion' }).click()
    await assertVisible(page.getByText('SPRING25'), 'Admin promotion creation should render.')
  } finally {
    await context.close()
  }
}

await waitForServer(baseURL)

try {
  await runAccessibilityScenario()
  await runStorefrontScenario()
  await runAdminScenario()
} finally {
  await browser.close()
}
