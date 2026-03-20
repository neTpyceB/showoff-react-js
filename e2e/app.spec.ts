import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('component playground works end-to-end', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Component Playground' }),
  ).toBeVisible()

  const accessibilityScan = await new AxeBuilder({ page }).analyze()
  expect(accessibilityScan.violations).toEqual([])

  await page.getByRole('button', { name: 'Open modal' }).click()
  await expect(page.getByRole('dialog', { name: 'Ship-ready modal' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirm' }).click()
  await expect(
    page.getByLabel('Notifications').getByText('Modal confirmed'),
  ).toBeVisible()

  await page.getByRole('tab', { name: 'Accessibility' }).click()
  await expect(page.getByText(/Focus management, ARIA semantics/i)).toBeVisible()

  await page.getByRole('button', { name: 'Quick actions' }).click()
  await page.getByRole('menuitem', { name: /publish preview/i }).click()
  await expect(
    page.getByLabel('Notifications').getByText('Preview published'),
  ).toBeVisible()

  await page.getByLabel('Name').fill('Ada Lovelace')
  await page.getByLabel('Email').fill('ada@example.com')
  await page.getByLabel('Company').fill('Analytical Engines')
  await page.getByLabel('Project brief').fill(
    'Build a production-grade component system with strong accessibility guarantees.',
  )
  await page.getByRole('button', { name: 'Send request' }).click()
  await expect(
    page.getByLabel('Notifications').getByText('Form submitted'),
  ).toBeVisible()
  await expect(
    page
      .getByLabel('Activity feed')
      .getByText(/Ada Lovelace requested the Growth workflow/i),
  ).toBeVisible()
})
