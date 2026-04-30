import { test, expect } from '@playwright/test'

// These tests cover PROJ-1: User Authentication (UI, validation, routing).
// Live auth flows (login/register/logout) require a real Supabase project.

test.describe('Login Page — UI & Validation', () => {
  test('renders login form with email, password fields and submit button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('shows validation error for invalid email format', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
  })

  test('forgot password link navigates to /forgot-password', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Forgot password?' }).click()
    await expect(page).toHaveURL('/forgot-password')
  })

  test('sign up link navigates to /register', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Sign up' }).click()
    await expect(page).toHaveURL('/register')
  })
})

test.describe('Register Page — UI & Validation', () => {
  test('renders registration form with all required fields', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Confirm password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()
  })

  test('shows error when password is shorter than 8 characters', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password', { exact: true }).fill('short')
    await page.getByLabel('Confirm password').fill('short')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
  })

  test('shows error when passwords do not match', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password', { exact: true }).fill('password123')
    await page.getByLabel('Confirm password').fill('different456')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('Passwords do not match')).toBeVisible()
  })

  test('shows validation error for invalid email format', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Email').fill('bad-email')
    await page.getByLabel('Password', { exact: true }).fill('password123')
    await page.getByLabel('Confirm password').fill('password123')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
  })

  test('sign in link navigates to /login', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Forgot Password Page — UI & Validation', () => {
  test('renders forgot password form with email field and submit button', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible()
  })

  test('shows validation error for invalid email format', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel('Email').fill('invalid-email')
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
  })

  test('back to sign in link navigates to /login', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByRole('link', { name: 'Back to sign in' }).first().click()
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Reset Password Page — UI & Validation', () => {
  test('renders reset password form with new password fields', async ({ page }) => {
    await page.goto('/auth/reset-password')
    await expect(page.getByLabel('New password', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Confirm new password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Set new password' })).toBeVisible()
  })

  test('shows error when new password is shorter than 8 characters', async ({ page }) => {
    await page.goto('/auth/reset-password')
    await page.getByLabel('New password', { exact: true }).fill('short')
    await page.getByLabel('Confirm new password').fill('short')
    await page.getByRole('button', { name: 'Set new password' }).click()
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
  })

  test('shows error when new passwords do not match', async ({ page }) => {
    await page.goto('/auth/reset-password')
    await page.getByLabel('New password', { exact: true }).fill('newpassword1')
    await page.getByLabel('Confirm new password').fill('newpassword2')
    await page.getByRole('button', { name: 'Set new password' }).click()
    await expect(page.getByText('Passwords do not match')).toBeVisible()
  })
})

test.describe('Route Protection — Unauthenticated Access', () => {
  test('unauthenticated user visiting / sees public idea feed (PROJ-2 made / public)', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Ideen-Board' })).toBeVisible()
  })

  test('unauthenticated user visiting /admin is redirected to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/login')
  })

  test('auth pages are publicly accessible without login', async ({ page }) => {
    for (const path of ['/login', '/register', '/forgot-password']) {
      await page.goto(path)
      await expect(page).toHaveURL(path)
    }
  })
})
