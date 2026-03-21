import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('finance tracker works end-to-end', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Personal Finance Tracker' }),
  ).toBeVisible()

  const accessibilityScan = await new AxeBuilder({ page }).analyze()
  expect(accessibilityScan.violations).toEqual([])

  await page.getByLabel('Title').fill('Codex gym plan')
  await page.getByLabel('Amount').fill('62.5')
  await page.getByLabel('Transaction category').selectOption('health')
  await page.getByLabel('Note').fill('Quarterly wellness membership.')
  await page.getByRole('button', { name: 'Save transaction' }).click()

  await expect(
    page.getByLabel('Notifications').getByText('Transaction saved'),
  ).toBeVisible()

  await page.getByLabel('Search').fill('Codex gym')
  await expect(
    page
      .getByRole('table')
      .getByText('Codex gym plan'),
  ).toBeVisible()

  await page.reload()
  await expect(page.getByRole('table').getByText('Codex gym plan')).toBeVisible()

  await page.getByRole('button', { name: 'Delete Codex gym plan' }).click()
  await expect(
    page.getByLabel('Notifications').getByText('Transaction removed'),
  ).toBeVisible()
  await expect(page.getByRole('table').getByText('Codex gym plan')).toHaveCount(0)
})
