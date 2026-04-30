# PROJ-1: User Authentication

## Status: Architected
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

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
