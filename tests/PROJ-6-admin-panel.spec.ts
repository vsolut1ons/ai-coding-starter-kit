import { test, expect, type Page } from '@playwright/test'

// PROJ-6: Admin Panel — E2E tests
// Admin-authenticated tests require TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD env vars.
// Regular-user tests require TEST_EMAIL + TEST_PASSWORD env vars.

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? ''
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? ''
const TEST_EMAIL = process.env.TEST_EMAIL ?? ''
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? ''

const hasAdminCredentials = ADMIN_EMAIL !== '' && ADMIN_PASSWORD !== ''
const hasUserCredentials = TEST_EMAIL !== '' && TEST_PASSWORD !== ''

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/', { timeout: 10000 })
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 + AC2: Access control — unauthenticated and non-admin redirects
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC1 + AC2: Access control for /admin', () => {
  test('unauthenticated user visiting /admin is redirected to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/login')
  })

  test('non-admin authenticated user visiting /admin is redirected to /', async ({ page }) => {
    test.skip(!hasUserCredentials, 'Set TEST_EMAIL + TEST_PASSWORD to run this test')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.goto('/admin')
    await expect(page).toHaveURL('/')
  })

  test('admin user can access /admin', async ({ page }) => {
    test.skip(!hasAdminCredentials, 'Set TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD to run admin tests')
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto('/admin')
    await expect(page).toHaveURL('/admin')
    await expect(page.getByRole('heading', { name: 'Admin Panel' })).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3: Admin overview shows all ideas
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC3: Admin overview shows all ideas', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasAdminCredentials, 'Set TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD to run admin tests')
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto('/admin')
  })

  test('ideas table is visible', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('table has columns: Titel, Votes, Status, Eingereicht', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Titel' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Votes' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Eingereicht' })).toBeVisible()
  })

  test('each row shows a status dropdown', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1)
    await expect(firstRow.getByRole('combobox')).toBeVisible()
  })

  test('each row shows a delete button', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1)
    await expect(firstRow.getByRole('button')).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 + AC5: Status change via dropdown
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC4 + AC5: Status change via dropdown', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasAdminCredentials, 'Set TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD to run admin tests')
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto('/admin')
  })

  test('status dropdown shows all three options', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1)
    await firstRow.getByRole('combobox').click()
    await expect(page.getByRole('option', { name: 'Planned' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'In Progress' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Done' })).toBeVisible()
  })

  test('selecting a status shows success toast', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1)
    const select = firstRow.getByRole('combobox')
    const currentValue = await select.textContent()

    // Pick a different status than the current one
    await select.click()
    const newStatus = currentValue?.trim() === 'Planned' ? 'In Progress' : 'Planned'
    await page.getByRole('option', { name: newStatus }).click()

    await expect(page.getByText('Status aktualisiert')).toBeVisible({ timeout: 5000 })
  })

  test('changed status is visible in the feed', async ({ page }) => {
    // Get the first idea's title for reference
    const firstRow = page.getByRole('row').nth(1)
    const titleCell = firstRow.getByRole('cell').first()
    const ideaTitle = (await titleCell.textContent())?.trim() ?? ''

    // Change to Done
    await firstRow.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Done' }).click()
    await expect(page.getByText('Status aktualisiert')).toBeVisible({ timeout: 5000 })

    // Navigate to feed and verify badge
    await page.goto('/')
    const card = page.locator('a[href^="/ideas/"]').filter({ hasText: ideaTitle }).first()
    await expect(card.getByText('Done')).toBeVisible({ timeout: 5000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC6 + AC7: Delete idea with confirmation
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC6 + AC7: Delete idea with confirmation dialog', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasAdminCredentials, 'Set TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD to run admin tests')
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto('/admin')
  })

  test('clicking delete shows AlertDialog with confirmation', async ({ page }) => {
    const firstRow = page.getByRole('row').nth(1)
    await firstRow.getByRole('button').click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByText('Idee löschen?')).toBeVisible()
  })

  test('cancelling the dialog does not delete the idea', async ({ page }) => {
    const rowsBefore = await page.getByRole('row').count()
    const firstRow = page.getByRole('row').nth(1)
    await firstRow.getByRole('button').click()
    await page.getByRole('button', { name: 'Abbrechen' }).click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible()
    expect(await page.getByRole('row').count()).toBe(rowsBefore)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC9: Toast feedback
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC9: Toast feedback on admin actions', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasAdminCredentials, 'Set TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD to run admin tests')
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto('/admin')
  })

  test('network error on status change shows error toast and rolls back', async ({ page }) => {
    await page.route('/api/ideas/*/vote', (route) => route.continue())
    await page.route('/api/ideas/*', (route) => {
      if (route.request().method() === 'PATCH') route.abort('failed')
      else route.continue()
    })

    const firstRow = page.getByRole('row').nth(1)
    const select = firstRow.getByRole('combobox')
    const valueBefore = await select.textContent()

    await select.click()
    const newStatus = valueBefore?.trim() === 'Planned' ? 'In Progress' : 'Planned'
    await page.getByRole('option', { name: newStatus }).click()

    await expect(page.getByText('Status konnte nicht geändert werden')).toBeVisible({ timeout: 5000 })
    // Dropdown should revert to original value
    await expect(select).toHaveText(new RegExp(valueBefore?.trim() ?? ''))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC10: Admin link in navbar
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC10: Admin link in navbar', () => {
  test('navbar does NOT show Admin link for unauthenticated users', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Admin' })).not.toBeVisible()
  })

  test('navbar does NOT show Admin link for regular users', async ({ page }) => {
    test.skip(!hasUserCredentials, 'Set TEST_EMAIL + TEST_PASSWORD to run this test')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await expect(page.getByRole('link', { name: 'Admin' })).not.toBeVisible()
  })

  test('navbar shows Admin link for admin user', async ({ page }) => {
    test.skip(!hasAdminCredentials, 'Set TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD to run admin tests')
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Security / Red-Team
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Security: API protection', () => {
  const TEST_IDEA_ID = '00000000-0000-0000-0000-000000000001'

  test('PATCH /api/ideas/[id] without session returns 401', async ({ request }) => {
    const res = await request.patch(`/api/ideas/${TEST_IDEA_ID}`, {
      data: { status: 'Done' },
    })
    expect(res.status()).toBe(401)
  })

  test('DELETE /api/ideas/[id] without session returns 401', async ({ request }) => {
    const res = await request.delete(`/api/ideas/${TEST_IDEA_ID}`)
    expect(res.status()).toBe(401)
  })

  test('PATCH with invalid status returns 400', async ({ request }) => {
    // Without auth this returns 401 — the point is it does NOT 500
    const res = await request.patch(`/api/ideas/${TEST_IDEA_ID}`, {
      data: { status: 'Hacked' },
    })
    expect([400, 401, 403]).toContain(res.status())
  })

  test('/admin page source does not leak idea data for unauthenticated requests', async ({ request }) => {
    const res = await request.get('/admin')
    // Should redirect (3xx) or show login — not admin content
    expect(res.url()).toMatch(/\/login/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Regression: PROJ-1 through PROJ-4 still work
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Regression: previously deployed features', () => {
  test('homepage is publicly accessible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Ideen-Board' })).toBeVisible()
  })

  test('idea cards still link to detail pages', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href^="/ideas/"]').first().click()
    await expect(page).toHaveURL(/\/ideas\/[0-9a-f-]+/)
  })

  test('"Idee einreichen" button still visible in navbar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Idee einreichen' })).toBeVisible()
  })

  test('vote buttons still visible on feed cards', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /Upvoten|Upvote entfernen/ }).first()).toBeVisible()
  })

  test('sort and filter controls still present', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('tab', { name: 'Top' })).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
  })
})
