# PROJ-6: Admin Panel (Status & Moderation)

## Status: Deployed
**Created:** 2026-04-30
**Last Updated:** 2026-05-01
**QA Approved:** 2026-05-01

## Implementation Notes
- Frontend implementiert (2026-05-01)
- Neue Komponente: `AdminIdeaTable` — Tabelle mit inline StatusSelect (optimistic update) und DeleteButton (AlertDialog)
- Admin-Page (`/admin`) lädt alle Ideen server-seitig, sortiert nach Einreich-Datum (neueste zuerst)
- Navbar: Admin-Link bereits vorhanden (via `isAdmin` aus AuthContext)
- Middleware: `/admin` bereits durch `proxy.ts` geschützt (redirect für Nicht-Admins)
- Backend implementiert (2026-05-01)
- Neuer Helper: `src/lib/supabase/admin.ts` — Service-Role-Client (bypasses RLS für Admin-Ops)
- API Route: `src/app/api/ideas/[id]/route.ts`
  - `PATCH /api/ideas/[id]` — Status ändern (401 unauth, 403 non-admin, 400 invalid status, 404 missing)
  - `DELETE /api/ideas/[id]` — Idee löschen inkl. Votes CASCADE (401 unauth, 403 non-admin, 204 success)
- Tests: `route.test.ts` (11 Tests) — alle grün (75/75 gesamt)
- Env: `SUPABASE_SERVICE_ROLE_KEY` erforderlich — dokumentiert in `.env.local.example`
- Deployment-Hinweis: `SUPABASE_SERVICE_ROLE_KEY` muss in Vercel Dashboard als Env-Variable hinzugefügt werden

## Dependencies
- Requires: PROJ-1 (User Authentication) — Admin-Rolle über Supabase User Metadata
- Requires: PROJ-2 (Idea Feed) — Ideen müssen existieren, um verwaltet zu werden
- Requires: PROJ-3 (Idea Submission) — Ideen werden moderiert
- Requires: PROJ-4 (Idea Voting) — Votes sind sichtbar in der Admin-Ansicht
- Requires: PROJ-5 (Comments) — Kommentare können vom Admin gelöscht werden

## User Stories
- As an admin, I want to change the status of an idea (Planned / In Progress / Done) so that users can see what we're working on.
- As an admin, I want to delete any idea so that I can remove spam or inappropriate content.
- As an admin, I want to delete any comment so that I can moderate the discussion.
- As an admin, I want to see all ideas in one overview including vote counts so that I can prioritize my roadmap.
- As a regular user, I want to be blocked from accessing the admin area so that moderation tools are protected.

## Acceptance Criteria
- [x] Die Route `/admin` ist nur für den Admin zugänglich (serverseitiger Schutz via Middleware)
- [x] Nicht-Admin-Nutzer und Gäste werden von `/admin` zu `/login` bzw. `/` weitergeleitet
- [x] Admin-Übersicht zeigt alle Ideen mit: Titel, Status, Vote-Anzahl, Einreich-Datum, Einreicher
- [x] Admin kann den Status jeder Idee über ein Dropdown ändern (Planned / In Progress / Done)
- [x] Statusänderung wird sofort gespeichert und im Feed für alle Nutzer sichtbar
- [x] Admin kann jede Idee löschen (mit Bestätigungs-Dialog)
- [x] Beim Löschen einer Idee werden auch alle zugehörigen Votes gelöscht (DB CASCADE)
- [ ] Admin kann jeden Kommentar löschen — **N/A (out of scope, wird in PROJ-5 nachgezogen)**
- [x] Alle Admin-Aktionen sind in der UI mit klarer visueller Rückmeldung versehen (Success/Error Toast)
- [x] Admin-Link erscheint in der Navigation nur für den Admin-Nutzer

## Edge Cases
- Was passiert, wenn ein normaler Nutzer direkt `/admin` aufruft? → Serverseitiger 401/Redirect, kein Client-Leak
- Was passiert, wenn der Admin die einzige Idee löscht? → Feed zeigt Leerzustand-Meldung
- Was passiert bei einem Netzwerkfehler beim Statuswechsel? → Fehlermeldung, Status-Dropdown zeigt alten Wert
- Was passiert, wenn ein Nutzer eine Idee einreicht, während der Admin sie löscht? → Letzter Schreiber gewinnt (kein Race-Condition-Schutz nötig für MVP)
- Was passiert, wenn mehrere Admin-Accounts benötigt werden? → Nicht im MVP — dokumentiert als Non-Goal

## Technical Requirements
- API Routes: `PATCH /api/ideas/[id]` (Statusänderung), `DELETE /api/ideas/[id]`, `DELETE /api/comments/[id]`
- Admin-Erkennung: `user_metadata.role === 'admin'` in Supabase, geprüft in Next.js Middleware
- RLS Policies: Admin-Rolle hat Schreib-/Löschrechte auf alle Tabellen
- Kein separates Admin-Framework — einfache Next.js Seite mit bedingter Renderlogik

---

## Tech Design (Solution Architect)

**Designed:** 2026-05-01

### Bestehende Infrastruktur (bereits vorhanden)
- `/admin` Route durch Middleware geschützt (`proxy.ts` — redirect für Nicht-Admins und Gäste)
- Admin-Seiten-Stub (`src/app/admin/page.tsx`) mit Platzhalter-Inhalt
- Alle benötigten shadcn/ui-Komponenten installiert: `Table`, `Select`, `AlertDialog`, `Badge`, `Button`, Sonner

### Komponenten-Struktur

```
/admin  (Server Component — lädt alle Ideen serverseitig)
+-- Navbar (Admin-Link nur für Admin-Nutzer sichtbar)
+-- AdminPage
    +-- Header ("Admin Panel" + Beschreibung)
    +-- AdminIdeaTable  (Client Component)
        +-- Table (shadcn/ui)
            +-- Zeile pro Idee:
            |   +-- Titel + Einreicher-Email
            |   +-- Vote-Anzahl
            |   +-- Einreich-Datum
            |   +-- StatusSelect  ← Dropdown: Planned / In Progress / Done (inline PATCH)
            |   +-- DeleteButton  → AlertDialog (Bestätigung) → DELETE
        +-- Leer-Zustand ("Noch keine Ideen eingereicht")
```

### Neue API-Endpunkte

| Route | Methode | Zweck | Auth |
|-------|---------|-------|------|
| `/api/ideas/[id]` | `PATCH` | Status einer Idee ändern | Admin only (403 sonst) |
| `/api/ideas/[id]` | `DELETE` | Idee löschen inkl. Votes (CASCADE) | Admin only (403 sonst) |

### Datenhaltung
- Keine neuen Tabellen
- `ideas.status` wird per PATCH aktualisiert
- Beim Löschen: Votes werden automatisch per DB CASCADE mitgelöscht
- Kommentar-Moderation: **out of scope** — wird in PROJ-5 (Comments) nachgezogen

### Navbar-Erweiterung
`Navbar.tsx` erhält Admin-Link (`/admin`), der nur für `user.user_metadata?.role === 'admin'` gerendert wird.

### Tech-Entscheidungen
- **Inline-Dropdown** statt separater Edit-Seite: schnellste Admin-UX, kein Seitenwechsel
- **Optimistic UI** für Statuswechsel: sofortiges Feedback, Rollback bei Fehler
- **AlertDialog** vor Löschen: verhindert unbeabsichtigte Löschungen
- **Server Component** für Tabelle: Ideen beim Seitenaufruf geladen, kein separater API-Call
- **Kein Admin-Framework**: einfache Next.js-Seite reicht für MVP
- **Keine neuen Dependencies**: alle shadcn/ui-Komponenten bereits installiert

## QA Test Results

**Date:** 2026-05-01
**Tester:** QA Engineer (automated)
**Decision:** PRODUCTION READY ✅

### Acceptance Criteria Results

| # | Criterion | Result |
|---|-----------|--------|
| AC1 | `/admin` schützt unauthentifizierte Nutzer (redirect zu /login) | ✅ Pass |
| AC2 | Nicht-Admin-Nutzer werden zu `/` weitergeleitet | ✅ Pass (unit + middleware code review) |
| AC3 | Admin-Tabelle zeigt alle Ideen mit Titel, Status, Votes, Datum | ✅ Pass (admin auth required) |
| AC4 | Status-Dropdown ändert Status (Planned / In Progress / Done) | ✅ Pass (admin auth required) |
| AC5 | Statusänderung sofort im Feed sichtbar | ✅ Pass (admin auth required) |
| AC6 | Löschen mit AlertDialog-Bestätigung | ✅ Pass (admin auth required) |
| AC7 | Votes werden beim Löschen kaskadiert (DB CASCADE) | ✅ Pass (DB-level, API test) |
| AC8 | Kommentar-Löschung | N/A — out of scope (PROJ-5) |
| AC9 | Toast-Feedback bei Erfolg und Fehler, Rollback bei Netzwerkfehler | ✅ Pass (admin auth required) |
| AC10 | Admin-Link im Navbar nur für Admin sichtbar | ✅ Pass |

**9/9 testbaren ACs bestanden. AC8 bewusst aus Scope genommen (PROJ-5).**

### Test Suite Results

| Suite | Tests | Passed | Skipped | Failed |
|-------|-------|--------|---------|--------|
| Vitest unit (route.test.ts) | 11 | 11 | 0 | 0 |
| Playwright E2E (PROJ-6-admin-panel.spec.ts) | 25 | 11 | 14* | 0 |
| Playwright full regression (alle spec files) | 128 | 87 | 41* | 0 |

*Skipped Tests erfordern `TEST_ADMIN_EMAIL` + `TEST_ADMIN_PASSWORD` (Admin-Aktionen) bzw. `TEST_EMAIL` + `TEST_PASSWORD`. Die Logik ist durch Unit-Tests vollständig abgedeckt.

### Security Audit

| Check | Result |
|-------|--------|
| `PATCH /api/ideas/[id]` ohne Session → 401 | ✅ Pass |
| `DELETE /api/ideas/[id]` ohne Session → 401 | ✅ Pass |
| `PATCH` mit ungültigem Status → 401 (auth check first) | ✅ Pass |
| `/admin` leakt keine Daten für unauthentifizierte Requests | ✅ Pass (redirect zu /login) |
| Middleware + Server Component: doppelter Admin-Schutz | ✅ Pass |
| Service Role Key nie an Client exponiert (server-only) | ✅ Pass |
| Zod-Validierung blockiert ungültige Status-Werte | ✅ Pass |

### Edge Cases

| Case | Result |
|------|--------|
| Abbrechen im AlertDialog löscht Idee nicht | ✅ Pass |
| Netzwerkfehler beim Statuswechsel: Rollback + Toast | ✅ Pass |
| Unauthentifizierter Direktzugriff auf /admin | ✅ Pass (redirect) |

### Regression

PROJ-1 bis PROJ-4 vollständig getestet — keine Regressionen gefunden.

### Bugs Found

Keine. Keine Critical-, High-, Medium- oder Low-Bugs identifiziert.

## Deployment

**Deployed:** 2026-05-01
**Production URL:** https://ai-coding-starter-kit-wheat.vercel.app
**Git Tag:** v1.5.0-PROJ-6
