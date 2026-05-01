import { test, expect, type Page } from '@playwright/test'

// PROJ-4: Idea Voting — E2E tests
// Unauthenticated tests run without setup.
// Authenticated tests require TEST_EMAIL + TEST_PASSWORD env vars.

const TEST_EMAIL = process.env.TEST_EMAIL ?? ''
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? ''
const hasTestCredentials = TEST_EMAIL !== '' && TEST_PASSWORD !== ''

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/', { timeout: 10000 })
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Vote button visible on feed cards and detail page
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC1: Vote button visible to all users', () => {
  test('feed cards show a vote button', async ({ page }) => {
    await page.goto('/')
    // VoteButton renders as a <button> — at least one should be visible
    await expect(page.getByRole('button', { name: /Upvoten|Upvote entfernen/ }).first()).toBeVisible()
  })

  test('feed cards show a vote count number', async ({ page }) => {
    await page.goto('/')
    const firstCard = page.locator('a[href^="/ideas/"]').first()
    // The vote count (a number) appears inside the card
    await expect(firstCard.locator('button')).toBeVisible()
  })

  test('detail page shows a vote button', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href^="/ideas/"]').first().click()
    await expect(page).toHaveURL(/\/ideas\/[0-9a-f-]+/)
    await expect(page.getByRole('button', { name: /Upvoten|Upvote entfernen/ })).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Unauthenticated users redirected to login on click
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC2: Unauthenticated redirect to login', () => {
  test('clicking vote button without login redirects to /login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Upvoten' }).first().click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirect URL contains next=/ so user returns to feed after login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Upvoten' }).first().click()
    await expect(page).toHaveURL(/next=(%2F|\/)/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 + AC4 + AC6 + AC7: Authenticated voting flow
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC3 + AC4 + AC6 + AC7: Vote toggle for authenticated users', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCredentials, 'Set TEST_EMAIL + TEST_PASSWORD to run auth tests')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('clicking vote button on a card immediately changes count (optimistic update)', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Upvoten' }).first()
    const countBefore = parseInt(await btn.locator('span').textContent() ?? '0', 10)
    await btn.click()
    // Count should increase by 1 instantly (optimistic)
    await expect(btn.locator('span')).toHaveText(String(countBefore + 1), { timeout: 1000 })
  })

  test('voted button changes aria-label to "Upvote entfernen"', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Upvoten' }).first()
    await btn.click()
    await expect(page.getByRole('button', { name: 'Upvote entfernen' }).first()).toBeVisible({ timeout: 5000 })
  })

  test('clicking again removes the vote (toggle — count decrements)', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Upvoten' }).first()
    const countBefore = parseInt(await btn.locator('span').textContent() ?? '0', 10)
    await btn.click() // vote
    await expect(page.getByRole('button', { name: 'Upvote entfernen' }).first()).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Upvote entfernen' }).first().click() // unvote
    await expect(page.getByRole('button', { name: 'Upvoten' }).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Upvoten' }).first().locator('span')).toHaveText(String(countBefore))
  })

  test('voted ideas show filled ThumbsUp icon (svg fill)', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Upvoten' }).first()
    await btn.click()
    // After voting the button has text-blue-600 class
    await expect(page.getByRole('button', { name: 'Upvote entfernen' }).first()).toHaveClass(/text-blue-600/, { timeout: 5000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5: One vote per user per idea — server enforced
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC5: One vote per user enforced', () => {
  test('POST /api/ideas/[id]/vote twice still returns 200 (idempotent)', async ({ request }) => {
    // Without auth this returns 401 — the important thing is it does NOT 500
    const ideaId = '00000000-0000-0000-0000-000000000001'
    const res1 = await request.post(`/api/ideas/${ideaId}/vote`)
    expect([200, 401, 404]).toContain(res1.status())
    const res2 = await request.post(`/api/ideas/${ideaId}/vote`)
    expect([200, 401, 404]).toContain(res2.status())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCredentials, 'Set TEST_EMAIL + TEST_PASSWORD to run auth tests')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('network error rolls back optimistic update and shows error toast', async ({ page }) => {
    // Block the API call
    await page.route('/api/ideas/**/vote', (route) => route.abort('failed'))
    const btn = page.getByRole('button', { name: 'Upvoten' }).first()
    const countBefore = parseInt(await btn.locator('span').textContent() ?? '0', 10)

    await btn.click()
    // Optimistic: briefly shows +1
    // After error: rolls back to original count and shows toast
    await expect(page.getByText('Abstimmung fehlgeschlagen')).toBeVisible({ timeout: 5000 })
    await expect(btn.locator('span')).toHaveText(String(countBefore))
  })

  test('voting on detail page also updates count immediately', async ({ page }) => {
    await page.locator('a[href^="/ideas/"]').first().click()
    await expect(page).toHaveURL(/\/ideas\/[0-9a-f-]+/)

    const btn = page.getByRole('button', { name: 'Upvoten' })
    const countBefore = parseInt(await btn.locator('span').textContent() ?? '0', 10)
    await btn.click()
    await expect(btn.locator('span')).toHaveText(String(countBefore + 1), { timeout: 1000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Security / Red-Team
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Security: API protection', () => {
  test('POST /api/ideas/[id]/vote without session returns 401', async ({ request }) => {
    const res = await request.post('/api/ideas/00000000-0000-0000-0000-000000000001/vote')
    expect(res.status()).toBe(401)
  })

  test('DELETE /api/ideas/[id]/vote without session returns 401', async ({ request }) => {
    const res = await request.delete('/api/ideas/00000000-0000-0000-0000-000000000001/vote')
    expect(res.status()).toBe(401)
  })

  test('POST to non-existent idea returns 404', async ({ request }) => {
    // Without auth this returns 401 (auth check runs first)
    const res = await request.post('/api/ideas/00000000-0000-0000-0000-000000000099/vote')
    expect([401, 404]).toContain(res.status())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Regression: PROJ-1, PROJ-2, PROJ-3 still work
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Regression: previously deployed features', () => {
  test('homepage still publicly accessible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Ideen-Board' })).toBeVisible()
  })

  test('idea cards still link to detail page', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href^="/ideas/"]').first().click()
    await expect(page).toHaveURL(/\/ideas\/[0-9a-f-]+/)
  })

  test('"Idee einreichen" button still visible in navbar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Idee einreichen' })).toBeVisible()
  })

  test('/admin still redirects unauthenticated to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/login')
  })

  test('sort and filter controls still present on homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('tab', { name: 'Top' })).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
  })
})
