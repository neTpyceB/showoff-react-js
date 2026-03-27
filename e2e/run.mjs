import assert from 'node:assert/strict'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import AxeBuilder from '@axe-core/playwright'
import { chromium } from 'playwright'

const port = Number(process.env.E2E_PORT ?? '4174')
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`
const primaryFeedPath = '/en/app/northstar/growth/atlas-cloud/production/feed'
const primaryCollaborationPath = '/en/app/northstar/growth/atlas-cloud/production/collaboration'
const primaryJobsPath = '/en/app/northstar/growth/atlas-cloud/production/jobs'
const primarySearchPath = '/en/app/northstar/growth/atlas-cloud/production/search'
const primaryNotificationsPath = '/en/app/northstar/growth/atlas-cloud/production/notifications'
const primaryObservabilityPath = '/en/app/northstar/growth/atlas-cloud/production/observability'
const primaryExperimentsPath = '/en/app/northstar/growth/atlas-cloud/production/experiments'
const defaultFeedPathByUser = {
  Alina: primaryFeedPath,
  Emil: primaryFeedPath,
  Felix: primaryFeedPath,
  Marta: '/en/app/northstar/reliability/pulse-ops/production/feed',
}

const waitForServer = async (url, timeoutMs = 60_000) => {
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

const assertVisible = async (locator, message, timeout = 15_000) => {
  await locator.waitFor({ state: 'visible', timeout })
  assert.equal(await locator.isVisible(), true, message)
}

const waitForText = async (page, text, timeout = 15_000) => {
  await assertVisible(page.getByText(text).first(), `Expected to find "${text}".`, timeout)
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

const loginAs = async (page, firstName, locale = 'en') => {
  await page.goto(`${baseURL}/${locale}/login`)
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes('/api/session/login')),
    page.getByRole('button', { name: new RegExp(`Sign in as ${firstName}`, 'i') }).click(),
  ])
  const targetPath = defaultFeedPathByUser[firstName]
  if (!targetPath) {
    throw new Error(`Missing seeded default route for ${firstName}.`)
  }
  await page.goto(`${baseURL}${targetPath}`)
  await page.waitForURL(new RegExp(`/${locale}/app/[^/]+/[^/]+/[^/]+/[^/]+/feed$`))
}

const runAccessibilityScenario = async () => {
  const { context, page } = await createPage()

  try {
    await page.goto(`${baseURL}/en/login`)
    await waitForText(page, 'Atlas Product Platform')

    const scan = await new AxeBuilder({ page }).analyze()
    assert.deepEqual(scan.violations, [], 'Accessibility violations found on login.')
  } finally {
    await context.close()
  }
}

const runAccessScenario = async () => {
  const protectedResponse = await fetch(`${baseURL}/api/search?q=latency`)
  assert.equal(protectedResponse.status, 401, 'Anonymous search API should return 401.')

  const { context, page } = await createPage()

  try {
    await page.goto(`${baseURL}${primaryFeedPath}`)
    await page.waitForURL(/\/en\/login$/)
    await waitForText(page, 'Atlas Product Platform')
  } finally {
    await context.close()
  }
}

const runOwnerScenario = async () => {
  const { context, page } = await createPage()

  try {
    await loginAs(page, 'Alina')
    await waitForText(page, 'Operational feed')

    await page.getByLabel('Organization').selectOption('solstice')
    await Promise.all([
      page.waitForURL(/\/en\/app\/solstice\/core\/solstice-app\/production\/feed$/),
      page.getByRole('button', { name: 'Update context' }).click(),
    ])
    await assertVisible(page.getByRole('heading', { name: 'Solstice App' }), 'Expected Solstice scope shell.')

    await Promise.all([
      page.waitForURL(/\/de\/app\/solstice\/core\/solstice-app\/production\/feed$/),
      page.locator('.locale-switcher').getByRole('link', { name: 'DE', exact: true }).click(),
    ])
    await waitForText(page, 'Abmelden')

    await Promise.all([
      page.waitForURL(/\/en\/app\/solstice\/core\/solstice-app\/production\/feed$/),
      page.locator('.locale-switcher').getByRole('link', { name: 'EN', exact: true }).click(),
    ])

    await page.getByLabel('Organization').selectOption('northstar')
    await page.getByLabel('Workspace').selectOption('growth')
    await page.getByLabel('Product').selectOption('atlas-cloud')
    await page.getByLabel('Environment').selectOption('production')
    await Promise.all([
      page.waitForURL(/\/en\/app\/northstar\/growth\/atlas-cloud\/production\/feed$/),
      page.getByRole('button', { name: 'Update context' }).click(),
    ])

    await page.goto(`${baseURL}${primarySearchPath}`)
    await assertVisible(page.getByRole('heading', { name: 'Search' }), 'Expected search page heading.')
    const searchInput = page.getByLabel('Search platform')
    await searchInput.fill('latency')
    await waitForText(page, 'Checkout latency regression')

    await page.goto(`${baseURL}${primaryNotificationsPath}`)
    const notificationId = await page.locator('input[name="notificationId"]').first().inputValue()
    const acknowledgeResponse = await page.context().request.post(
      `${baseURL}/api/notifications/${encodeURIComponent(notificationId)}/ack`,
    )
    assert.equal(acknowledgeResponse.status(), 200, 'Expected notification acknowledge API to succeed.')

    await page.goto(`${baseURL}${primaryObservabilityPath}`)
    await page.getByLabel('Observability query type').selectOption('incidents')
    await page.getByRole('button', { name: 'Run query' }).click()
    await waitForText(page, 'Checkout latency regression')

    await page.goto(`${baseURL}${primaryExperimentsPath}`)
    const experimentCard = page.locator('article').filter({ hasText: 'Smart inbox ranking' })
    await Promise.all([
      page.waitForResponse((response) =>
        response.request().method() === 'POST' && response.url().includes(primaryExperimentsPath),
      ),
      experimentCard.getByRole('button', { name: 'Start rollout' }).click(),
    ])
    await page.goto(`${baseURL}${primaryFeedPath}`)
    await waitForText(page, 'Smart inbox ranking rollout started')
  } finally {
    await context.close()
  }
}

const runRealtimeScenario = async () => {
  const feedSession = await createPage()
  const collabSession = await createPage()
  const presenceSession = await createPage()

  try {
    await loginAs(feedSession.page, 'Alina')
    await feedSession.page.goto(`${baseURL}${primaryFeedPath}`)

    await loginAs(collabSession.page, 'Emil')
    await collabSession.page.goto(`${baseURL}${primaryCollaborationPath}`)
    const commentText = `Realtime decision ${Date.now()}`
    await collabSession.page.locator('textarea[name="body"]').first().fill(commentText)
    await collabSession.page.getByRole('button', { name: 'Add comment' }).first().click()
    await waitForText(feedSession.page, commentText, 20_000)

    await loginAs(presenceSession.page, 'Felix')
    await feedSession.page.goto(`${baseURL}${primaryCollaborationPath}`)
    await presenceSession.page.goto(`${baseURL}${primaryCollaborationPath}`)
    await waitForText(feedSession.page, 'Active sessions: 2', 20_000)
  } finally {
    await feedSession.context.close()
    await collabSession.context.close()
    await presenceSession.context.close()
  }
}

const runJobsScenario = async () => {
  const { context, page } = await createPage()

  try {
    await loginAs(page, 'Alina')
    await page.goto(`${baseURL}${primaryJobsPath}`)
    await assertVisible(page.getByRole('heading', { name: 'Jobs' }), 'Expected jobs page heading.')
    await waitForText(page, 'analytics-backfill')
    await Promise.all([
      page.waitForResponse((response) =>
        response.request().method() === 'POST' && response.url().includes(primaryJobsPath),
      ),
      page.getByRole('button', { name: 'Retry job' }).click(),
    ])
    await page.goto(`${baseURL}${primaryFeedPath}`)
    await waitForText(page, 'analytics-backfill completed cleanly', 20_000)
  } finally {
    await context.close()
  }
}

const runViewerScenario = async () => {
  const { context, page } = await createPage()

  try {
    await loginAs(page, 'Felix')
    await page.goto(`${baseURL}${primaryJobsPath}`)
    await assertVisible(page.getByRole('heading', { name: 'Access denied' }), 'Viewer should see access denied.')
  } finally {
    await context.close()
  }
}

await waitForServer(baseURL)

try {
  await runAccessibilityScenario()
  await runAccessScenario()
  await runOwnerScenario()
  await runRealtimeScenario()
  await runJobsScenario()
  await runViewerScenario()
} finally {
  await browser.close()
}
