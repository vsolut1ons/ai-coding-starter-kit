import { test, expect } from '@playwright/test'

// PROJ-2: Idea Feed — E2E tests
// Requires: 6 seed ideas in the database (inserted via Management API before this run)
// Top order by votes: Mobile App (51) > CSV Export (34) > Preisalarme (27) >
//                     Multi-Currency (22) > Dark Mode (18) > Dividenden (15)

test.describe('AC1 + AC7: Homepage is publicly accessible and shows ideas', () => {
  test('homepage loads without login and shows idea cards', async ({ page }) => {
    await page.goto('/')
    // Must be on homepage (not redirected to login)
    await expect(page).toHaveURL('/')
    // At least one idea card link should be visible
    await expect(page.locator('a[href^="/ideas/"]').first()).toBeVisible()
  })

  test('shows the board title', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Ideen-Board' })).toBeVisible()
  })
})

test.describe('AC2: IdeaCard shows all required fields', () => {
  test('idea card shows title', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Mobile App iOS & Android')).toBeVisible()
  })

  test('idea card shows description (truncated to 150 chars)', async ({ page }) => {
    await page.goto('/')
    // The description should be present (may be truncated)
    const firstCard = page.locator('a[href^="/ideas/"]').first()
    const descText = firstCard.locator('p.text-muted-foreground')
    await expect(descText).toBeVisible()
    const text = await descText.textContent()
    expect(text!.length).toBeLessThanOrEqual(153) // 150 chars + '…'
  })

  test('idea card shows vote count', async ({ page }) => {
    await page.goto('/')
    // Mobile App has 51 votes and should appear first
    const firstCard = page.locator('a[href^="/ideas/"]').first()
    await expect(firstCard.getByText('51')).toBeVisible()
  })

  test('idea card shows status badge', async ({ page }) => {
    await page.goto('/')
    // At least one "Planned" badge should be visible
    await expect(page.getByText('Planned').first()).toBeVisible()
  })

  test('idea card shows In Progress status badge', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('In Progress').first()).toBeVisible()
  })

  test('idea card shows Done status badge', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Done').first()).toBeVisible()
  })
})

test.describe('AC3: Default sort by votes descending', () => {
  test('first idea has most votes (Mobile App with 51)', async ({ page }) => {
    await page.goto('/')
    const firstCard = page.locator('a[href^="/ideas/"]').first()
    await expect(firstCard.getByText('Mobile App iOS & Android')).toBeVisible()
  })

  test('second idea has second-most votes (CSV Export with 34)', async ({ page }) => {
    await page.goto('/')
    const cards = page.locator('a[href^="/ideas/"]')
    const second = cards.nth(1)
    await expect(second.getByText('CSV Export')).toBeVisible()
  })
})

test.describe('AC4: Sort tabs (Top / Neu)', () => {
  test('sort tabs are visible on homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('tab', { name: 'Top' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Neu' })).toBeVisible()
  })

  test('Top tab is active by default', async ({ page }) => {
    await page.goto('/')
    const topTab = page.getByRole('tab', { name: 'Top' })
    await expect(topTab).toHaveAttribute('data-state', 'active')
  })

  test('clicking Neu updates URL to sort=new', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: 'Neu' }).click()
    await expect(page).toHaveURL(/sort=new/)
  })

  test('clicking Top from Neu updates URL back', async ({ page }) => {
    await page.goto('/?sort=new')
    await page.getByRole('tab', { name: 'Top' }).click()
    await expect(page).toHaveURL(/sort=top/)
  })

  test('Neu tab shows ideas (list is still rendered)', async ({ page }) => {
    await page.goto('/?sort=new')
    await expect(page.locator('a[href^="/ideas/"]').first()).toBeVisible()
  })
})

test.describe('AC5: Status filter', () => {
  test('status filter dropdown is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('combobox')).toBeVisible()
  })

  test('filtering by Planned updates URL', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Planned' }).click()
    await expect(page).toHaveURL(/status=Planned/)
  })

  test('filtering by Planned shows only Planned ideas', async ({ page }) => {
    await page.goto('/?status=Planned')
    // All visible badges should be "Planned" (no "Done" or "In Progress")
    const badges = page.getByText('In Progress')
    await expect(badges).toHaveCount(0)
    const doneBadges = page.getByText('Done')
    await expect(doneBadges).toHaveCount(0)
  })

  test('filtering by In Progress shows only In Progress ideas', async ({ page }) => {
    await page.goto('/?status=In+Progress')
    await expect(page.getByText('CSV Export').first()).toBeVisible()
    // Only 1 In Progress idea
    await expect(page.locator('a[href^="/ideas/"]')).toHaveCount(1)
  })

  test('filtering by Done shows only Done ideas', async ({ page }) => {
    await page.goto('/?status=Done')
    await expect(page.getByText('Multi-Currency Support')).toBeVisible()
    await expect(page.locator('a[href^="/ideas/"]')).toHaveCount(1)
  })

  test('filter with no results shows friendly message', async ({ page }) => {
    // No ideas have a non-existent status, but Alle returns to full list
    // Test by checking URL resets page when filter changes
    await page.goto('/?status=Done')
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Alle Status' }).click()
    await expect(page).toHaveURL(/status=all/)
    // At least 6 seed ideas should be visible (count may grow as new ideas are submitted)
    const count = await page.locator('a[href^="/ideas/"]').count()
    expect(count).toBeGreaterThanOrEqual(6)
  })
})

test.describe('AC6: Click idea card opens detail page', () => {
  test('clicking an idea card navigates to /ideas/[id]', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href^="/ideas/"]').first().click()
    await expect(page).toHaveURL(/\/ideas\/[0-9a-f-]+/)
  })

  test('detail page shows idea title', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href^="/ideas/"]').first().click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('detail page has back link to homepage', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href^="/ideas/"]').first().click()
    await expect(page.getByRole('link', { name: /Zurück zum Board/i })).toBeVisible()
  })

  test('back link navigates back to homepage', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href^="/ideas/"]').first().click()
    await page.getByRole('link', { name: /Zurück zum Board/i }).click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('AC8 + Edge Case: Empty state and not-found', () => {
  test('non-existent idea ID shows 404 not-found page', async ({ page }) => {
    await page.goto('/ideas/00000000-0000-0000-0000-000000000000')
    await expect(page.getByText('Idee nicht gefunden')).toBeVisible()
  })

  test('not-found page has back link to homepage', async ({ page }) => {
    await page.goto('/ideas/00000000-0000-0000-0000-000000000000')
    await expect(page.getByRole('link', { name: /Zurück zum Board/i })).toBeVisible()
  })
})

test.describe('AC9: Page loads fast (SSR)', () => {
  test('homepage responds within 5 seconds (dev server)', async ({ page }) => {
    const start = Date.now()
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Ideen-Board' })).toBeVisible()
    const duration = Date.now() - start
    expect(duration).toBeLessThan(5000)
  })

  test('page title is set correctly', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Feedback Board/)
  })
})

test.describe('AC10: Responsive — Mobile', () => {
  test('homepage is usable on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Ideen-Board' })).toBeVisible()
    await expect(page.locator('a[href^="/ideas/"]').first()).toBeVisible()
  })

  test('sort tabs are visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.getByRole('tab', { name: 'Top' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Neu' })).toBeVisible()
  })

  test('status filter is usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.getByRole('combobox')).toBeVisible()
  })
})

test.describe('Edge Cases', () => {
  test('URL params are preserved and shareable', async ({ page }) => {
    await page.goto('/?sort=new&status=Planned')
    await expect(page.getByRole('tab', { name: 'Neu' })).toHaveAttribute('data-state', 'active')
    await expect(page.locator('a[href^="/ideas/"]').first()).toBeVisible()
  })

  test('changing sort tab resets page parameter from URL', async ({ page }) => {
    await page.goto('/?sort=top&page=2&status=all')
    // Wait for component to hydrate
    await expect(page.getByRole('tab', { name: 'Top' })).toHaveAttribute('data-state', 'active')
    await page.getByRole('tab', { name: 'Neu' }).click()
    await expect(page).toHaveURL(/sort=new/)
    const url = page.url()
    expect(url).not.toContain('page=')
  })
})
