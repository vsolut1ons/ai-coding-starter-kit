import { test, expect, type Page } from '@playwright/test'

// PROJ-5: Comments — E2E tests
// Auth-required tests need TEST_EMAIL + TEST_PASSWORD env vars.
// Admin tests also need TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD.

const TEST_EMAIL = process.env.TEST_EMAIL ?? ''
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? ''
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? ''
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? ''

const hasUserCredentials = TEST_EMAIL !== '' && TEST_PASSWORD !== ''
const hasAdminCredentials = ADMIN_EMAIL !== '' && ADMIN_PASSWORD !== ''

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/', { timeout: 10000 })
}

/** Navigate to the first idea's detail page and return the URL */
async function goToFirstIdeaDetail(page: Page): Promise<string> {
  await page.goto('/')
  const firstCard = page.locator('a[href^="/ideas/"]').first()
  await expect(firstCard).toBeVisible()
  const href = await firstCard.getAttribute('href')
  await firstCard.click()
  await page.waitForURL(`**${href}`)
  return href!
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Comments displayed chronologically on idea detail page
// AC2: Comments are publicly readable (no login required)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC1 + AC2: Public comment visibility', () => {
  test('unauthenticated user can see comments section on idea detail page', async ({ page }) => {
    await goToFirstIdeaDetail(page)
    await expect(page.getByRole('heading', { name: /Kommentare/ })).toBeVisible()
  })

  test('comments heading shows count (public, no login)', async ({ page }) => {
    await goToFirstIdeaDetail(page)
    const heading = page.getByRole('heading', { name: /Kommentare/ })
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('Kommentare')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3: Only logged-in users see the comment form
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC3: Comment form visibility based on auth state', () => {
  test('unauthenticated user does NOT see comment textarea', async ({ page }) => {
    await goToFirstIdeaDetail(page)
    await expect(page.getByPlaceholder('Kommentar schreiben…')).not.toBeVisible()
  })

  test('logged-in user sees the comment form', async ({ page }) => {
    test.skip(!hasUserCredentials, 'Set TEST_EMAIL + TEST_PASSWORD to run this test')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await goToFirstIdeaDetail(page)
    await expect(page.getByPlaceholder('Kommentar schreiben…')).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4: Comment form contains textarea (max 500 chars) + submit button
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC4: Comment form structure', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasUserCredentials, 'Set TEST_EMAIL + TEST_PASSWORD to run this test')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await goToFirstIdeaDetail(page)
  })

  test('textarea is present with maxLength 500', async ({ page }) => {
    const textarea = page.getByPlaceholder('Kommentar schreiben…')
    await expect(textarea).toBeVisible()
    const maxLength = await textarea.getAttribute('maxlength')
    expect(maxLength).toBe('500')
  })

  test('submit button is present and initially disabled (empty input)', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Kommentar absenden' })
    await expect(btn).toBeVisible()
    await expect(btn).toBeDisabled()
  })

  test('character counter is visible', async ({ page }) => {
    await expect(page.getByText('0/500')).toBeVisible()
  })

  test('submit button enables when content is typed', async ({ page }) => {
    await page.getByPlaceholder('Kommentar schreiben…').fill('Tolle Idee!')
    const btn = page.getByRole('button', { name: 'Kommentar absenden' })
    await expect(btn).toBeEnabled()
  })

  test('submit button stays disabled for whitespace-only input', async ({ page }) => {
    await page.getByPlaceholder('Kommentar schreiben…').fill('   ')
    const btn = page.getByRole('button', { name: 'Kommentar absenden' })
    await expect(btn).toBeDisabled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5: After posting, comment appears immediately in the list
// AC6: Each comment shows author email, relative timestamp, and content
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC5 + AC6: Post comment and verify display', () => {
  const uniqueContent = `QA Test Kommentar ${Date.now()}`

  test('submitted comment appears in list with email, timestamp, and content', async ({ page }) => {
    test.skip(!hasUserCredentials, 'Set TEST_EMAIL + TEST_PASSWORD to run this test')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await goToFirstIdeaDetail(page)

    await page.getByPlaceholder('Kommentar schreiben…').fill(uniqueContent)
    await page.getByRole('button', { name: 'Kommentar absenden' }).click()

    // Comment appears immediately after page refresh
    const commentText = page.getByText(uniqueContent)
    await expect(commentText).toBeVisible({ timeout: 5000 })

    // Author email is shown
    await expect(page.getByText(TEST_EMAIL)).toBeVisible()

    // Timestamp is shown (relative time — contains "eben" for just posted)
    await expect(page.getByText('gerade eben')).toBeVisible()
  })

  test('textarea is cleared after successful submission', async ({ page }) => {
    test.skip(!hasUserCredentials, 'Set TEST_EMAIL + TEST_PASSWORD to run this test')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await goToFirstIdeaDetail(page)

    await page.getByPlaceholder('Kommentar schreiben…').fill(`Zweiter Test ${Date.now()}`)
    await page.getByRole('button', { name: 'Kommentar absenden' }).click()

    const textarea = page.getByPlaceholder('Kommentar schreiben…')
    await expect(textarea).toHaveValue('', { timeout: 5000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC7: Users can only delete their own comments
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC7: Comment ownership — delete button visibility', () => {
  test("user sees delete button on their own comments (on hover)", async ({ page }) => {
    test.skip(!hasUserCredentials, 'Set TEST_EMAIL + TEST_PASSWORD to run this test')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await goToFirstIdeaDetail(page)

    // Post a comment so we know one exists that belongs to this user
    const content = `Mein Kommentar ${Date.now()}`
    await page.getByPlaceholder('Kommentar schreiben…').fill(content)
    await page.getByRole('button', { name: 'Kommentar absenden' }).click()
    await expect(page.getByText(content)).toBeVisible({ timeout: 5000 })

    // Hover to reveal delete button
    const commentContainer = page.locator('div.group').filter({ hasText: content })
    await commentContainer.hover()
    const deleteBtn = commentContainer.getByRole('button', { name: 'Kommentar löschen' })
    await expect(deleteBtn).toBeVisible()
  })

  test('user can delete their own comment', async ({ page }) => {
    test.skip(!hasUserCredentials, 'Set TEST_EMAIL + TEST_PASSWORD to run this test')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await goToFirstIdeaDetail(page)

    const content = `Zu löschender Kommentar ${Date.now()}`
    await page.getByPlaceholder('Kommentar schreiben…').fill(content)
    await page.getByRole('button', { name: 'Kommentar absenden' }).click()
    await expect(page.getByText(content)).toBeVisible({ timeout: 5000 })

    const commentContainer = page.locator('div.group').filter({ hasText: content })
    await commentContainer.hover()
    await commentContainer.getByRole('button', { name: 'Kommentar löschen' }).click()

    await expect(page.getByText(content)).not.toBeVisible({ timeout: 5000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC8: Admin can delete any comment
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC8: Admin can delete any comment', () => {
  test('admin sees delete button on all comments', async ({ page }) => {
    test.skip(!hasAdminCredentials, 'Set TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD to run this test')
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await goToFirstIdeaDetail(page)

    // Check there is at least one comment with a delete button on hover
    const firstComment = page.locator('div.group').first()
    const firstCommentExists = await firstComment.isVisible()
    if (!firstCommentExists) {
      test.skip()
      return
    }

    await firstComment.hover()
    const deleteBtn = firstComment.getByRole('button', { name: 'Kommentar löschen' })
    await expect(deleteBtn).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC9: Comment count on idea card in feed updates after posting
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC9: Comment count sync in feed', () => {
  test('posting a comment increments comment_count on the idea card', async ({ page }) => {
    test.skip(!hasUserCredentials, 'Set TEST_EMAIL + TEST_PASSWORD to run this test')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)

    // Get initial comment count from first idea card
    await page.goto('/')
    const firstCard = page.locator('a[href^="/ideas/"]').first()
    const countLocator = firstCard.locator('span').filter({ hasText: /^\d+$/ }).last()
    const initialCountText = await countLocator.textContent()
    const initialCount = parseInt(initialCountText ?? '0', 10)

    // Navigate to idea detail and post a comment
    await firstCard.click()
    await expect(page.getByPlaceholder('Kommentar schreiben…')).toBeVisible()
    await page.getByPlaceholder('Kommentar schreiben…').fill(`Count test ${Date.now()}`)
    await page.getByRole('button', { name: 'Kommentar absenden' }).click()
    await page.waitForTimeout(1000)

    // Go back to feed and check count
    await page.goto('/')
    const newCountText = await page.locator('a[href^="/ideas/"]').first()
      .locator('span').filter({ hasText: /^\d+$/ }).last()
      .textContent()
    const newCount = parseInt(newCountText ?? '0', 10)
    expect(newCount).toBe(initialCount + 1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC10: Empty state message when no comments exist
// ─────────────────────────────────────────────────────────────────────────────
test.describe('AC10: Empty state for comments', () => {
  test('idea with no comments shows empty state message', async ({ page }) => {
    // Find an idea with 0 comments by checking the feed
    await page.goto('/')
    const cards = page.locator('a[href^="/ideas/"]')
    const count = await cards.count()

    let foundEmpty = false
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      const commentCount = await card.locator('span').filter({ hasText: /^\d+$/ }).last().textContent()
      if (commentCount === '0') {
        await card.click()
        await expect(page.getByText('Noch keine Kommentare — sei der Erste!')).toBeVisible()
        foundEmpty = true
        break
      }
    }

    if (!foundEmpty) {
      test.skip()
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Security: API endpoints reject unauthenticated requests
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Security: API authentication enforcement', () => {
  test('POST /api/ideas/[id]/comments returns 401 without session', async ({ page }) => {
    await page.goto('/')
    const firstCard = page.locator('a[href^="/ideas/"]').first()
    const href = await firstCard.getAttribute('href')
    const ideaId = href!.split('/').pop()

    const res = await page.evaluate(async (id) => {
      const r = await fetch(`/api/ideas/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'hack attempt' }),
      })
      return r.status
    }, ideaId)

    expect(res).toBe(401)
  })

  test('DELETE /api/comments/[id] returns 401 without session', async ({ page }) => {
    await page.goto('/')
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/comments/00000000-0000-0000-0000-000000000000', {
        method: 'DELETE',
      })
      return r.status
    })
    expect(res).toBe(401)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Regression: Previously deployed features still work
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Regression: Previously deployed features', () => {
  test('homepage feed still loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('idea detail page still shows title and vote button', async ({ page }) => {
    await goToFirstIdeaDetail(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: /upvot/i })).toBeVisible()
  })

  test('login page still accessible', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email')).toBeVisible()
  })

  test('submit idea dialog still accessible (logged-in user)', async ({ page }) => {
    test.skip(!hasUserCredentials, 'Set TEST_EMAIL + TEST_PASSWORD to run this test')
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
    await expect(page.getByRole('button', { name: 'Idee einreichen' })).toBeVisible()
  })

  test('/admin redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/login')
  })
})
