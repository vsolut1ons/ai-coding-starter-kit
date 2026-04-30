# PROJ-3: Idea Submission (Idee einreichen)

## Status: Planned
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

## Dependencies
- Requires: PROJ-1 (User Authentication) — nur eingeloggte Nutzer dürfen einreichen
- Requires: PROJ-2 (Idea Feed) — nach Einreichung Weiterleitung zum Feed oder zur Detailseite

## User Stories
- As a logged-in user, I want to submit a new product idea with a title and description so that others can vote on it.
- As a logged-in user, I want to see a confirmation after submitting so that I know my idea was saved.
- As a visitor (not logged in), I want to be prompted to log in when I try to submit an idea so that I understand why I can't proceed.
- As a logged-in user, I want to see my own submitted ideas highlighted in the feed so that I can track them.

## Acceptance Criteria
- [ ] Es gibt einen klaren "Idee einreichen"-Button im Feed (sichtbar für alle, aber Login-geschützt)
- [ ] Nicht eingeloggte Nutzer werden beim Klick zur Login-Seite weitergeleitet (mit Redirect-Back nach Login)
- [ ] Das Einreich-Formular enthält: Titel (Pflichtfeld, max. 100 Zeichen) + Beschreibung (Pflichtfeld, max. 1000 Zeichen)
- [ ] Zeichenzähler wird in Echtzeit angezeigt
- [ ] Formular-Validierung: Leere Felder blockieren das Absenden mit klarer Fehlermeldung
- [ ] Nach erfolgreichem Einreichen erscheint eine Erfolgsmeldung (Toast/Snackbar)
- [ ] Die neue Idee erscheint sofort im Feed (optimistic update oder Redirect)
- [ ] Ein Nutzer kann dieselbe Idee nicht doppelt einreichen (Duplikat-Check auf Titelebene, case-insensitive)
- [ ] Eingereichte Idee startet mit Status "Planned" und 0 Votes
- [ ] Eingereichter-Nutzer-Name ist mit der Idee verknüpft (wird auf der Detailseite angezeigt)

## Edge Cases
- Was passiert bei einem Netzwerkfehler beim Absenden? → Fehlermeldung + Formulardaten bleiben erhalten (kein Datenverlust)
- Was passiert bei XSS-Versuchen im Titel/Beschreibung? → Eingaben werden serverseitig bereinigt (sanitized)
- Was passiert, wenn der Nutzer das Formular verlässt ohne abzusenden? → Keine Warnung nötig (MVP)
- Was passiert bei einem Titel, der nur Leerzeichen enthält? → Validierung schlägt fehl (trim vor der Prüfung)
- Was passiert, wenn ein Duplikat erkannt wird? → Hinweis mit Link zur bestehenden Idee

## Technical Requirements
- API Route: `POST /api/ideas`
- Eingaben serverseitig validieren (Zod)
- Duplikat-Check: case-insensitive Titelvergleich auf Datenbankebene
- RLS Policy: Nur authentifizierte Nutzer dürfen in die `ideas`-Tabelle schreiben

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
