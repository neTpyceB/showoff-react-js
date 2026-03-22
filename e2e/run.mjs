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
      const response = await fetch(url)

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

const newPage = async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: {
      width: 1280,
      height: 720,
    },
  })
  const page = await context.newPage()

  return {
    browser,
    page,
  }
}

const closePage = async (browser) => {
  await browser.close()
}

const assertVisible = async (locator, message) => {
  await locator.waitFor({ state: 'visible' })
  assert.equal(await locator.isVisible(), true, message)
}

const runAccessibilityScenario = async () => {
  const { browser, page } = await newPage()

  try {
    await page.goto(`${baseURL}/login`)
    await assertVisible(
      page.getByRole('heading', { name: 'Kanban Task Manager' }),
      'Login heading should be visible.',
    )

    const accessibilityScan = await new AxeBuilder({ page }).analyze()
    assert.deepEqual(accessibilityScan.violations, [], 'Accessibility violations found.')
  } finally {
    await closePage(browser)
  }
}

const loginAs = async (page, userName) => {
  await page.getByRole('button', { name: `Sign in as ${userName}` }).click()
}

const runBoardScenario = async () => {
  const { browser, page } = await newPage()

  try {
    await page.goto(`${baseURL}/spaces/platform`)
    await page.waitForURL(/\/login$/)
    assert.match(page.url(), /\/login$/, 'Anonymous user should be redirected to /login.')

    await loginAs(page, 'Alice')
    await page.waitForURL(/\/spaces\/platform$/)
    assert.match(
      page.url(),
      /\/spaces\/platform$/,
      'Alice should land on the platform team space.',
    )
    await assertVisible(
      page.getByRole('heading', { name: 'Platform Rebuild' }),
      'Board heading should be visible after login.',
    )

    await page.getByLabel('Task title').fill('Harden route redirect checks')
    await page
      .getByLabel('Task description')
      .fill('Verify private space redirects and explicit permission failures.')
    await page.getByRole('button', { name: 'Create task' }).click()
    await assertVisible(page.getByText('Task created'), 'Task creation toast should appear.')
    await page.getByText('Task created').waitFor({ state: 'hidden' })

    const moveRightButton = page
      .getByLabel('Harden route redirect checks assigned to Alice Johnson')
      .getByRole('button', { name: 'Move right' })
    await assertVisible(moveRightButton, 'Move right action should be visible for the task.')
    await moveRightButton.click({ force: true })
    await assertVisible(page.getByText('Task moved'), 'Task movement toast should appear.')
    await page.getByText('Task moved').waitFor({ state: 'hidden' })

    await assertVisible(
      page.getByLabel('In Progress dropzone').getByText('Harden route redirect checks'),
      'Moved task should appear in In Progress.',
    )

    await page.reload()
    await assertVisible(
      page.getByRole('heading', { name: 'Platform Rebuild' }),
      'Board heading should still be visible after reload.',
    )
    await assertVisible(
      page.getByLabel('In Progress dropzone').getByText('Harden route redirect checks'),
      'Moved task should persist after reload.',
    )
  } finally {
    await closePage(browser)
  }
}

const runViewerScenario = async () => {
  const { browser, page } = await newPage()

  try {
    await page.goto(`${baseURL}/login`)
    await loginAs(page, 'Casey')
    await page.waitForURL(/\/spaces\/platform$/)
    assert.match(
      page.url(),
      /\/spaces\/platform$/,
      'Viewer login should land on the platform team space.',
    )
    await assertVisible(
      page.getByText('Viewer access: board changes are blocked by permissions.'),
      'Viewer access copy should be visible.',
    )
    assert.equal(
      await page.getByRole('button', { name: 'Create task' }).isDisabled(),
      true,
      'Viewer should not be allowed to create tasks.',
    )
  } finally {
    await closePage(browser)
  }
}

await waitForServer(baseURL)
await runBoardScenario()
await runViewerScenario()
await runAccessibilityScenario()
