# PROJ-6: Admin Panel (Status & Moderation)

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
