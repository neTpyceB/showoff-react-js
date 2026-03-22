import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import AxeBuilder from '@axe-core/playwright'
import { chromium } from 'playwright'

const port = Number(process.env.E2E_PORT ?? '4174')
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`
const uploadFixture = resolve(process.cwd(), 'e2e/fixtures/sample.txt')

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

const createBrowser = async () =>
  chromium.launch({
    headless: true,
  })

const createPage = async (browser) => {
  const context = await browser.newContext({
    viewport: {
      width: 1440,
      height: 960,
    },
  })

  return {
    context,
    page: await context.newPage(),
  }
}

const loginAs = async (page, firstName) => {
  await page.goto(`${baseURL}/login`)
  await page.getByRole('button', { name: `Sign in as ${firstName}` }).click()
  await page.waitForURL(/\/channels\/general$/)
  await page.locator('.connection-pill[data-state="online"]').waitFor({ state: 'visible' })
}

const messageCard = (page, text) => page.locator('article').filter({ hasText: text }).first()

const runAccessibilityScenario = async (browser) => {
  const { context, page } = await createPage(browser)

  try {
    await page.goto(`${baseURL}/channels/general`)
    await page.waitForURL(/\/login$/)
    await assertVisible(
      page.getByRole('heading', { name: 'Orbit Team Chat' }),
      'Login heading should be visible.',
    )

    const scan = await new AxeBuilder({ page }).analyze()
    assert.deepEqual(scan.violations, [], 'Accessibility violations found on the login route.')
  } finally {
    await context.close()
  }
}

const runCoreChatScenario = async (browser) => {
  const { context: aliceContext, page: alicePage } = await createPage(browser)
  const { context: benContext, page: benPage } = await createPage(browser)

  try {
    await loginAs(alicePage, 'Alice')
    await loginAs(benPage, 'Ben')

    await assertVisible(
      alicePage.locator('.member-row').filter({ hasText: 'Ben Carter' }).getByText('Online'),
      'Presence should show Ben as online.',
    )

    await benPage.bringToFront()
    const benComposer = benPage.getByLabel('Upload image or doc')
    await benComposer.setInputFiles(uploadFixture)
    await assertVisible(benPage.getByText('sample.txt'), 'Uploaded document should be attached.')

    await alicePage.goto(`${baseURL}/channels/support`)
    await delay(700)
    await alicePage.goto(`${baseURL}/channels/general`)
    await alicePage.waitForURL(/\/channels\/general$/)

    await alicePage.bringToFront()
    const threadButton = messageCard(
      alicePage,
      'General coordination update 24. Track live status, owners, and unblockers here.',
    ).getByRole('button', {
      name: /0 replies/i,
    })
    await threadButton.evaluate((button) => {
      button.click()
    })
    await alicePage.waitForURL(/thread=/)
    await assertVisible(
      alicePage.getByText('Thread', { exact: true }),
      'Thread panel should open for the selected message.',
    )

    await benPage.bringToFront()
    await benPage.goto(`${baseURL}/channels/support`)
    await alicePage.goto(`${baseURL}/channels/support`)
    await assertVisible(
      alicePage.getByRole('heading', { name: '#support' }),
      'Support channel should load correctly.',
    )

    await alicePage.goto(`${baseURL}/channels/general`)
    const newestBeforePagination = alicePage.getByText('General coordination update 24. Track live status, owners, and unblockers here.')
    await assertVisible(newestBeforePagination, 'Newest seeded message should be visible.')
    await alicePage.getByRole('button', { name: 'Load older' }).click()
    await assertVisible(
      alicePage.getByText('General coordination update 6. Track live status, owners, and unblockers here.'),
      'Older paginated messages should load.',
    )
    await assertVisible(
      newestBeforePagination,
      'Loading older messages should preserve the current viewport context.',
    )
  } finally {
    await aliceContext.close()
    await benContext.close()
  }
}

await waitForServer(baseURL)
const browser = await createBrowser()

try {
  await runAccessibilityScenario(browser)
  await runCoreChatScenario(browser)
} finally {
  await browser.close()
}
