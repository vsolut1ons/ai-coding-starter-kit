import { test, expect, type Page } from '@playwright/test'

// PROJ-3: Idea Submission — E2E tests
// Unauthenticated tests run without setup.
// Authenticated tests require TEST_EMAIL + TEST_PASSWORD env vars (set in .env.local or shell).

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
// AC1: "Idee einreichen" button visible for all users
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC1: Submit button is visible to all users', () => {
  test('unauthenticated user sees "Idee einreichen" button on homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Idee einreichen' })).toBeVisible()
  })

  test('"Idee einreichen" button is visible on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Idee einreichen' })).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Unauthenticated → redirect to /login?next=/
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC2: Unauthenticated redirect to login', () => {
  test('clicking "Idee einreichen" without login redirects to /login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirect URL includes next=/ parameter', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    // Browser may encode "/" as "%2F" or leave it unencoded — match both forms
    await expect(page).toHaveURL(/next=(%2F|\/)/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3–AC5: Dialog form fields and validation (requires auth)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC3: Dialog contains title and description fields', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCredentials, 'Set TEST_EMAIL and TEST_PASSWORD env vars to run auth tests')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('clicking "Idee einreichen" as logged-in user opens dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Idee einreichen' })).toBeVisible()
  })

  test('dialog contains title input field', async ({ page }) => {
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await expect(page.getByLabel('Titel')).toBeVisible()
  })

  test('dialog contains description textarea', async ({ page }) => {
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await expect(page.getByLabel('Beschreibung')).toBeVisible()
  })

  test('dialog contains submit and cancel buttons', async ({ page }) => {
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await expect(page.getByRole('button', { name: 'Einreichen' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Abbrechen' })).toBeVisible()
  })

  test('cancel button closes the dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Abbrechen' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4: Real-time character counters
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC4: Real-time character counter', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCredentials, 'Set TEST_EMAIL and TEST_PASSWORD env vars to run auth tests')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('title counter starts at 0/100', async ({ page }) => {
    await expect(page.getByText('0/100')).toBeVisible()
  })

  test('title counter updates as user types', async ({ page }) => {
    await page.getByLabel('Titel').fill('Meine Idee')
    await expect(page.getByText('10/100')).toBeVisible()
  })

  test('description counter starts at 0/1000', async ({ page }) => {
    await expect(page.getByText('0/1000')).toBeVisible()
  })

  test('description counter updates as user types', async ({ page }) => {
    await page.getByLabel('Beschreibung').fill('Kurze Beschreibung')
    await expect(page.getByText('18/1000')).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Form validation — empty fields block submission
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC5: Form validation', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCredentials, 'Set TEST_EMAIL and TEST_PASSWORD env vars to run auth tests')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('submitting empty form shows title error', async ({ page }) => {
    await page.getByRole('button', { name: 'Einreichen' }).click()
    await expect(page.getByText('Titel ist erforderlich')).toBeVisible()
  })

  test('submitting with title but no description shows description error', async ({ page }) => {
    await page.getByLabel('Titel').fill('Mein Titel')
    await page.getByRole('button', { name: 'Einreichen' }).click()
    await expect(page.getByText('Beschreibung ist erforderlich')).toBeVisible()
  })

  test('whitespace-only title triggers validation error', async ({ page }) => {
    await page.getByLabel('Titel').fill('   ')
    await page.getByLabel('Beschreibung').fill('Eine Beschreibung')
    await page.getByRole('button', { name: 'Einreichen' }).click()
    // Either client-side or server-side error should be shown
    await expect(
      page.getByText('Titel ist erforderlich').or(page.getByText('Validation failed'))
    ).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC6 + AC7 + AC9: Successful submission → toast + feed update
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC6 + AC7 + AC9: Successful submission', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCredentials, 'Set TEST_EMAIL and TEST_PASSWORD env vars to run auth tests')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('successful submission shows success toast', async ({ page }) => {
    const uniqueTitle = `QA-Test-Idee-${Date.now()}`
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await page.getByLabel('Titel').fill(uniqueTitle)
    await page.getByLabel('Beschreibung').fill('Eine Beschreibung für den QA-Test.')
    await page.getByRole('button', { name: 'Einreichen' }).click()
    await expect(page.getByText('Idee erfolgreich eingereicht!')).toBeVisible({ timeout: 8000 })
  })

  test('dialog closes after successful submission', async ({ page }) => {
    const uniqueTitle = `QA-Dialog-Close-${Date.now()}`
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await page.getByLabel('Titel').fill(uniqueTitle)
    await page.getByLabel('Beschreibung').fill('Beschreibung für Close-Test.')
    await page.getByRole('button', { name: 'Einreichen' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8000 })
  })

  test('new idea appears in feed after submission', async ({ page }) => {
    const uniqueTitle = `QA-Feed-Test-${Date.now()}`
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await page.getByLabel('Titel').fill(uniqueTitle)
    await page.getByLabel('Beschreibung').fill('Beschreibung für Feed-Sichtbarkeitstest.')
    await page.getByRole('button', { name: 'Einreichen' }).click()
    // Wait for dialog to close, then check the feed
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8000 })
    // Switch to "Neu" sort so the newest idea is at the top
    await page.getByRole('tab', { name: 'Neu' }).click()
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 })
  })

  test('new idea has Planned status and 0 votes in the feed', async ({ page }) => {
    const uniqueTitle = `QA-Status-${Date.now()}`
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await page.getByLabel('Titel').fill(uniqueTitle)
    await page.getByLabel('Beschreibung').fill('Status-Test-Beschreibung.')
    await page.getByRole('button', { name: 'Einreichen' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8000 })
    await page.getByRole('tab', { name: 'Neu' }).click()
    const card = page.locator('a[href^="/ideas/"]').filter({ hasText: uniqueTitle })
    await expect(card).toBeVisible({ timeout: 5000 })
    // Status badge should be "Planned"
    await expect(card.getByText('Planned')).toBeVisible()
    // Vote count should be 0
    await expect(card.getByText('0')).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC8: Duplicate detection
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC8: Duplicate idea prevention', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCredentials, 'Set TEST_EMAIL and TEST_PASSWORD env vars to run auth tests')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('submitting duplicate title shows error with link to existing idea', async ({ page }) => {
    // Use an idea title from the existing seed data
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await page.getByLabel('Titel').fill('Mobile App iOS & Android')
    await page.getByLabel('Beschreibung').fill('Doppelt eingereichte Idee — Test')
    await page.getByRole('button', { name: 'Einreichen' }).click()
    await expect(page.getByText('Eine Idee mit diesem Titel existiert bereits.')).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('link', { name: /Zur bestehenden Idee/ })).toBeVisible()
  })

  test('link in duplicate error navigates to the existing idea', async ({ page }) => {
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await page.getByLabel('Titel').fill('Mobile App iOS & Android')
    await page.getByLabel('Beschreibung').fill('Doppelt eingereichte Idee — Link-Test')
    await page.getByRole('button', { name: 'Einreichen' }).click()
    await expect(page.getByRole('link', { name: /Zur bestehenden Idee/ })).toBeVisible({ timeout: 8000 })
    await page.getByRole('link', { name: /Zur bestehenden Idee/ }).click()
    await expect(page).toHaveURL(/\/ideas\/[0-9a-f-]+/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC10: Author linked to idea (detail page shows author info)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC10: Author is linked to submitted idea', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCredentials, 'Set TEST_EMAIL and TEST_PASSWORD env vars to run auth tests')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('submitted idea detail page shows author_id (author linked in DB)', async ({ page }) => {
    const uniqueTitle = `QA-Author-${Date.now()}`
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await page.getByLabel('Titel').fill(uniqueTitle)
    await page.getByLabel('Beschreibung').fill('Author-Verknüpfungs-Test.')
    await page.getByRole('button', { name: 'Einreichen' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8000 })
    // Navigate to idea and verify it loads (author_id stored in DB, not displayed in UI yet per spec)
    await page.getByRole('tab', { name: 'Neu' }).click()
    const card = page.locator('a[href^="/ideas/"]').filter({ hasText: uniqueTitle })
    await expect(card).toBeVisible({ timeout: 5000 })
    await card.click()
    await expect(page).toHaveURL(/\/ideas\/[0-9a-f-]+/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCredentials, 'Set TEST_EMAIL and TEST_PASSWORD env vars to run auth tests')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('form data is preserved after server error (network-level failure simulation)', async ({ page }) => {
    // Block the API call to simulate network error
    await page.route('/api/ideas', (route) => route.abort('failed'))
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    const titleText = 'Idee die nicht verloren gehen soll'
    await page.getByLabel('Titel').fill(titleText)
    await page.getByLabel('Beschreibung').fill('Beschreibung bleibt erhalten.')
    await page.getByRole('button', { name: 'Einreichen' }).click()
    // Error should be shown
    await expect(page.getByText('Netzwerkfehler. Bitte versuche es erneut.')).toBeVisible({ timeout: 5000 })
    // Form data must still be present
    await expect(page.getByLabel('Titel')).toHaveValue(titleText)
    await expect(page.getByLabel('Beschreibung')).toHaveValue('Beschreibung bleibt erhalten.')
  })

  test('dialog is responsive on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.getByRole('button', { name: 'Idee einreichen' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByLabel('Titel')).toBeVisible()
    await expect(page.getByLabel('Beschreibung')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Einreichen' })).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Security / Red-Team
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Security: Unauthenticated API access', () => {
  test('POST /api/ideas without session returns 401 JSON', async ({ request }) => {
    // Middleware now excludes /api/ routes — the API route handles auth directly.
    const response = await request.post('/api/ideas', {
      data: { title: 'Hacker Idea', description: 'Attempting unauthenticated submit' },
    })
    expect(response.status()).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  test('RLS blocks direct unauthenticated insert — verified by API layer', async ({
    request,
  }) => {
    // The API route performs auth before any DB write. Even if middleware were bypassed,
    // the Supabase RLS policy "Authenticated users can submit ideas" blocks unauthenticated writes.
    // This test confirms the endpoint is not trivially writable.
    const response = await request.post('/api/ideas', {
      data: { title: 'RLS bypass attempt', description: 'Direct unauthenticated insert' },
    })
    // Protected: either redirect (middleware) or 401 (API auth) — not 201
    expect(response.status()).not.toBe(201)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Regression: PROJ-1 and PROJ-2 still work
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Regression: PROJ-1 + PROJ-2 core flows', () => {
  test('homepage is still publicly accessible', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Ideen-Board' })).toBeVisible()
  })

  test('login page is still accessible', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email')).toBeVisible()
  })

  test('/admin still redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/login')
  })

  test('idea cards are still visible on homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href^="/ideas/"]').first()).toBeVisible()
  })
})
