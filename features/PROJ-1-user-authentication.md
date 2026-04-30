# PROJ-1: User Authentication

## Status: In Review
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

## Dependencies
- None (Fundament für alle anderen Features)

## User Stories
- As a new visitor, I want to register with email and password so that I can submit and vote on ideas.
- As a returning user, I want to log in with my email and password so that I can access my account and votes.
- As a logged-in user, I want to log out so that my account is secure on shared devices.
- As a user who forgot my password, I want to reset it via email so that I can regain access to my account.
- As an admin, I want a protected admin area that only I can access so that moderation tools are not exposed to regular users.

## Acceptance Criteria
- [ ] Nutzer kann sich mit E-Mail + Passwort registrieren
- [ ] Registrierung schlägt fehl, wenn die E-Mail bereits vergeben ist (klare Fehlermeldung)
- [ ] Nutzer erhält nach der Registrierung eine Bestätigungs-E-Mail (Supabase Email Confirmation)
- [ ] Nutzer kann sich mit E-Mail + Passwort einloggen
- [ ] Login schlägt fehl bei falschen Zugangsdaten (klare Fehlermeldung, kein Hinweis welches Feld falsch ist)
- [ ] Nutzer kann sich ausloggen (Session wird serverseitig invalidiert)
- [ ] Passwort-Reset per E-Mail funktioniert
- [ ] Nicht eingeloggte Nutzer werden bei geschützten Seiten zur Login-Seite weitergeleitet
- [ ] Admin-Nutzer (definiert per Supabase-Role oder Metadatum) kann auf /admin zugreifen
- [ ] Normale Nutzer werden von /admin weggleitet (403 oder Redirect)
- [ ] Auth-State wird clientseitig korrekt aktualisiert (kein manuelles Page-Reload nötig)

## Edge Cases
- Was passiert, wenn die Bestätigungs-E-Mail nicht ankommt? → Erneut senden-Button in der UI
- Was passiert, wenn ein Nutzer versucht sich mit einer ungültigen E-Mail-Adresse zu registrieren? → Validierungsfehler vor dem Absenden
- Was passiert bei abgelaufener Session? → Automatischer Redirect zur Login-Seite
- Was passiert, wenn der Passwort-Reset-Link abgelaufen ist? → Klare Fehlermeldung mit Option, einen neuen Link anzufordern
- Was passiert, wenn der Admin sein Passwort ändert? → Bestehende Sessions bleiben bis zum Ablauf gültig

## Technical Requirements
- Supabase Auth (eigenes Projekt, getrennt von Portfolio-App)
- Passwort-Mindestlänge: 8 Zeichen
- E-Mail-Bestätigung: aktiviert in Supabase-Einstellungen
- Admin-Erkennung: via `user_metadata.role = 'admin'` oder Supabase Custom Claims
- Geschützte Routen: Next.js Middleware für serverseitigen Schutz

---

## Tech Design (Solution Architect)

### Overview

Authentication is the foundation of the entire app. Every other feature (voting, submitting ideas, admin moderation) depends on knowing *who* the user is. We use **Supabase Auth** — a managed authentication service that handles passwords, email confirmations, and sessions, so no custom security-critical login logic is built from scratch.

---

### Pages & Routes

```
/login                   → Login form
/register                → Registration form
/forgot-password         → Request password reset email
/auth/callback           → Supabase redirects here after email confirmation
/auth/reset-password     → New password form (from reset email link)
/admin                   → Protected area (admin only)
Next.js Middleware        → Guards all protected pages server-side
```

---

### Component Structure

```
/login
+-- LoginForm
|   +-- Email field (shadcn Input)
|   +-- Password field (shadcn Input)
|   +-- Submit button (shadcn Button)
|   +-- Error message (shadcn Alert)
|   +-- Link → Register
|   +-- Link → Forgot password

/register
+-- RegisterForm
|   +-- Email field
|   +-- Password field (min. 8 characters)
|   +-- Password confirmation field
|   +-- Submit button
|   +-- Error message (e.g. email already taken)
|   +-- Success state: "Check your inbox" message
|   |   +-- "Resend email" button (for edge case)

/forgot-password
+-- ForgotPasswordForm
|   +-- Email field
|   +-- Submit button
|   +-- Success state: "Reset link sent" message

/auth/reset-password
+-- ResetPasswordForm
|   +-- New password field
|   +-- Confirm password field
|   +-- Submit button
|   +-- Error state for expired links

/auth/callback
+-- (No visible UI — processes email confirmation, then redirects to home)
```

---

### Data Model

No custom database table needed for auth — Supabase manages all user data internally.

```
User Session:
- User ID (unique identifier)
- Email address
- Role flag: user_metadata.role = "admin" (set manually in Supabase dashboard)
- Session expiry (handled automatically by Supabase)

Stored in: Encrypted cookies (Supabase SSR — works with Next.js server-side rendering)
```

---

### Route Protection Logic

```
Middleware (runs on every request, server-side):

  Public routes (no login required):
  → /login, /register, /forgot-password, /auth/*

  Protected routes (login required):
  → Everything else → if not logged in: redirect to /login

  Admin routes (admin role required):
  → /admin/* → if not admin: redirect to / (home)
```

---

### Auth State in the Browser

```
AuthProvider (wraps entire app in layout.tsx)
+-- Listens to Supabase auth state changes
+-- Makes current user available everywhere via React Context
+-- No manual page reload needed when login/logout happens
+-- Navbar updates instantly (show "Log out" vs "Log in")
```

---

### Tech Decisions

| Decision | Why |
|---|---|
| **Supabase Auth** | Handles passwords, email confirmation, sessions, and password reset securely — no custom auth logic needed |
| **Cookie-based sessions** (`@supabase/ssr`) | Required for Next.js App Router — server components can read the session, enabling server-side route protection |
| **Next.js Middleware** | Route protection happens *before* the page renders — users can't even briefly see a protected page |
| **`react-hook-form` + Zod** | Already in the stack; validates email format and password length before submitting to Supabase |
| **shadcn/ui components** | `Form`, `Input`, `Button`, `Alert`, `Card` are all already installed — no new UI work needed |
| **Admin via `user_metadata.role`** | Simple and flexible — set once in Supabase dashboard, no custom database table needed for MVP |

---

### Dependencies to Install

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Supabase client (auth, database queries) |
| `@supabase/ssr` | Cookie-based session handling for Next.js App Router |

---

### Summary

5 pages, 1 middleware file, 1 auth context provider, and 2 Supabase client helpers (browser + server). All form UI reuses already-installed shadcn/ui components. No custom authentication logic — Supabase handles all security-critical parts.

## Implementation Notes (Frontend)

**Built 2026-04-30**

### Files created
- `src/lib/supabase/client.ts` — browser client (`createBrowserClient`)
- `src/lib/supabase/server.ts` — server client (`createServerClient` + cookies)
- `src/context/AuthContext.tsx` — `AuthProvider` + `useAuth` hook
- `src/proxy.ts` — Next.js 16 route proxy (renamed from middleware) for session refresh + route protection
- `src/components/LoginForm.tsx` — email + password, generic error message
- `src/components/RegisterForm.tsx` — email + password + confirm, "Check inbox" success state + resend button
- `src/components/ForgotPasswordForm.tsx` — email only, "Reset link sent" success state
- `src/components/ResetPasswordForm.tsx` — new password + confirm, expired-link error with re-request link
- `src/components/Navbar.tsx` — shows user email + Sign out / Sign in + Sign up depending on auth state
- `src/app/(auth)/layout.tsx` — centered gray-50 background layout for all auth pages
- `src/app/(auth)/login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`
- `src/app/auth/callback/route.ts` — exchanges Supabase code for session, redirects to `/`
- `src/app/auth/reset-password/page.tsx`
- `src/app/admin/page.tsx` — server-side admin role guard, placeholder for PROJ-6

### Deviations from spec
- `src/lib/supabase.ts` left as-is (legacy placeholder); new helpers live in `src/lib/supabase/`
- Home page (`/`) updated with Navbar + placeholder text for PROJ-2 idea feed

### Setup required before testing
1. Copy `.env.local.example` → `.env.local` and fill in real Supabase credentials
2. In Supabase Dashboard: set Site URL and add `/auth/callback` to allowed redirect URLs
3. To grant admin access, run in Supabase SQL Editor:
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
   WHERE email = 'admin@vsolutions.ch';
   ```

## Implementation Notes (Backend)

**Built 2026-04-30**

### Bug fixed
- `src/proxy.ts` (exported `proxy` function) was replaced with `src/middleware.ts` (exports `middleware`).
  Next.js only recognises `src/middleware.ts` — the previous filename was never executed, leaving all route protection broken.

### Tests added
- `src/app/auth/callback/route.test.ts` — 4 integration tests covering:
  - Valid code → session exchange → redirect to `/`
  - Valid code with `next` param → redirect to custom path
  - Failed exchange → redirect to `/login?error=auth_callback_failed`
  - No code present → redirect to `/login?error=auth_callback_failed`

### Security fix
- `.env.local.example` replaced real-looking Supabase credentials with placeholder values

## QA Test Results

**QA Date:** 2026-04-30
**Tester:** /qa skill
**Production Ready:** NO — Medium bugs must be fixed first

---

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Register with email + password | ✅ PASS | Form submits to Supabase; success state shown |
| 2 | Duplicate email shows clear error | ✅ PASS | Error message shown (fragile string match — see L-1) |
| 3 | Confirmation email sent after registration | ✅ PASS | Supabase handles; "Check inbox" state + Resend button present |
| 4 | Login with email + password | ✅ PASS | signInWithPassword + redirect to / |
| 5 | Login failure shows generic error (no field hint) | ✅ PASS | "Invalid email or password." — does not hint which field |
| 6 | Logout invalidates session | ✅ PASS | signOut() + redirect to /login |
| 7 | Password reset via email | ✅ PASS | resetPasswordForEmail + "Check inbox" success state |
| 8 | Unauthenticated users redirected to /login | ✅ PASS | Confirmed by E2E test (/, /admin → /login) |
| 9 | Admin can access /admin | ✅ PASS | Server-side guard via user_metadata.role |
| 10 | Non-admin redirected from /admin | ✅ PASS | Middleware + server component both check role |
| 11 | Auth state updates without page reload | ✅ PASS | onAuthStateChange in AuthProvider |

---

### Edge Case Results

| Edge Case | Result | Notes |
|-----------|--------|-------|
| Invalid email format rejected before submit | ⚠️ PARTIAL | Browser native tooltip shows but custom Zod message does not — see M-3 |
| Confirmation email not received → Resend button | ✅ PASS | "Resend email" button present in success state |
| Expired session → redirect to /login | ✅ PASS | Middleware calls getUser() which handles refresh/expiry |
| Expired password reset link | ✅ PASS | Error message + "Request a new link" link shown |
| Admin password change keeps existing sessions | ✅ PASS | Handled by Supabase; no custom logic needed |

---

### Security Audit

| Check | Result | Notes |
|-------|--------|-------|
| Route protection bypasses | ✅ PASS | Middleware uses getUser() (server-validated), not getSession() |
| Admin escalation (non-admin accessing /admin) | ✅ PASS | Both middleware AND server component guard independently |
| XSS via form inputs | ✅ PASS | No dangerouslySetInnerHTML; Zod validates inputs |
| Open redirect in /auth/callback | ✅ PASS | `next` param prepended to `origin` — cross-domain redirect impossible |
| Secrets in client bundle | ✅ PASS | No hardcoded secrets; .env.local.example uses placeholder values |
| Login error leaks which field is wrong | ✅ PASS | Single generic message: "Invalid email or password." |
| Rate limiting | ⚠️ INFO | No app-level rate limiting; relies on Supabase built-in limits |

---

### Automated Test Results

**Unit tests (Vitest):** 12/12 passed
- `src/app/auth/callback/route.test.ts` — 4 tests (callback route logic)
- `src/context/AuthContext.test.tsx` — 8 tests (auth state, isAdmin, subscriptions)

**E2E tests (Playwright/Chromium):** 18/18 passed
- 15 tests pass normally
- 3 tests marked `test.fail()` — document known bug M-3 (email validation messages)
- File: `tests/PROJ-1-user-authentication.spec.ts`

---

### Bugs Found

#### Medium

**M-1 — `src/middleware.ts` is deprecated in Next.js 16**
- **Where:** `src/middleware.ts` (entire file)
- **Severity:** Medium
- **Description:** Build warns: `The "middleware" file convention is deprecated. Please use "proxy" instead.` Route protection still works but will generate warnings in every build and may break in a future Next.js update.
- **Reproduce:** Run `npm run build` — see deprecation warning.
- **Fix:** Rename `src/middleware.ts` → `src/proxy.ts`; rename exported function `middleware` → `proxy`.

**M-2 — `AuthContext` uses deprecated `getSession()` on client**
- **Where:** [src/context/AuthContext.tsx:25](src/context/AuthContext.tsx#L25)
- **Severity:** Medium
- **Description:** `supabase.auth.getSession()` reads from localStorage without server validation. Supabase docs recommend `getUser()` for security-sensitive reads. The middleware already uses `getUser()` for route protection, so the practical risk is low for MVP, but this should be corrected before production.
- **Fix:** Replace `getSession()` call with `getUser()` or rely solely on `onAuthStateChange`.

**M-3 — Forms lack `noValidate` — Zod email error messages never appear**
- **Where:** `src/components/LoginForm.tsx`, `RegisterForm.tsx`, `ForgotPasswordForm.tsx`
- **Severity:** Medium
- **Description:** All three forms use `<input type="email">` without `noValidate` on the `<form>` element. When an invalid email is entered, the browser's native constraint validation fires first and blocks the submit event entirely — react-hook-form never runs Zod validation, so the styled error messages (e.g., "Please enter a valid email address") are never shown. Users see an unstyled browser tooltip instead of the app's error UI.
- **Reproduce:** Go to /login, enter "bad@" in the email field, click "Sign in" — browser tooltip appears, no red shadcn error message.
- **Fix:** Add `noValidate` attribute to the `<form>` elements in LoginForm, RegisterForm, and ForgotPasswordForm.

#### Low

**L-1 — Duplicate email detection uses fragile string matching**
- **Where:** [src/components/RegisterForm.tsx:56](src/components/RegisterForm.tsx#L56)
- **Severity:** Low
- **Description:** `error.message.toLowerCase().includes('already')` is brittle. If Supabase changes its error message format, the specific "already exists" error silently falls through to showing the raw Supabase message.
- **Fix:** Check `error.code` (e.g., `'user_already_exists'`) instead of string matching on the message.

**L-2 — Admin page has no Navbar**
- **Where:** `src/app/admin/page.tsx`
- **Severity:** Low
- **Description:** The admin page has no Navbar, so an admin user cannot sign out or navigate back to the home page without manually editing the URL.
- **Fix:** Import and render `<Navbar />` at the top of the admin page.

**L-3 — Reset password page shows generic error for unauthenticated direct access**
- **Where:** `src/components/ResetPasswordForm.tsx`
- **Severity:** Low
- **Description:** If a user navigates directly to `/auth/reset-password` without a recovery token, `supabase.auth.updateUser()` fails. The error is caught, but the message "Could not update password. Please try again." appears without the "Request a new link" option (that link only shows for errors containing "expired"). Supabase's error for missing session ("Auth session missing!") doesn't contain "expired" or "invalid", so the helpful link is skipped.
- **Fix:** Also check `error.message.toLowerCase().includes('session')` in the condition, or add a session check on page mount.

---

### Production-Ready Decision

**NOT READY** — 3 Medium bugs must be fixed before deployment.

Priority fix order:
1. **M-3** (noValidate) — visible UX regression affecting all form validation feedback
2. **M-1** (middleware → proxy rename) — build warning, forward-compatibility risk
3. **M-2** (getSession → getUser) — security best practice

## Deployment
_To be added by /deploy_
