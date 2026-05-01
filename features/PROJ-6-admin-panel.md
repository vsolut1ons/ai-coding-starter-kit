# PROJ-6: Admin Panel (Status & Moderation)

## Status: Architected
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

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
- [ ] Die Route `/admin` ist nur für den Admin zugänglich (serverseitiger Schutz via Middleware)
- [ ] Nicht-Admin-Nutzer und Gäste werden von `/admin` zu `/` weitergeleitet
- [ ] Admin-Übersicht zeigt alle Ideen mit: Titel, Status, Vote-Anzahl, Einreich-Datum, Einreicher
- [ ] Admin kann den Status jeder Idee über ein Dropdown ändern (Planned / In Progress / Done)
- [ ] Statusänderung wird sofort gespeichert und im Feed für alle Nutzer sichtbar
- [ ] Admin kann jede Idee löschen (mit Bestätigungs-Dialog)
- [ ] Beim Löschen einer Idee werden auch alle zugehörigen Votes und Kommentare gelöscht
- [ ] Admin kann jeden Kommentar direkt aus der Admin-Ansicht oder der Detailseite löschen
- [ ] Alle Admin-Aktionen sind in der UI mit klarer visueller Rückmeldung versehen (Success/Error Toast)
- [ ] Admin-Link erscheint in der Navigation nur für den Admin-Nutzer

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
_To be added by /qa_

## Deployment
_To be added by /deploy_
