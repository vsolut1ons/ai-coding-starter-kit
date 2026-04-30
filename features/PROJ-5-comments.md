# PROJ-5: Comments (Kommentare unter Ideen)

## Status: Planned
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

## Dependencies
- Requires: PROJ-1 (User Authentication) — nur eingeloggte Nutzer dürfen kommentieren
- Requires: PROJ-2 (Idea Feed) — Kommentare erscheinen auf der Detailseite einer Idee
- Requires: PROJ-3 (Idea Submission) — Ideen müssen existieren, um kommentiert zu werden

## User Stories
- As a logged-in user, I want to write a comment on an idea so that I can add context or discuss it.
- As a visitor, I want to read all comments on an idea so that I can understand the discussion without logging in.
- As a logged-in user, I want to delete my own comment so that I can correct mistakes.
- As an admin, I want to delete any comment so that I can moderate inappropriate content.
- As a user, I want to see who wrote a comment and when so that I can follow the discussion chronologically.

## Acceptance Criteria
- [ ] Auf der Detailseite einer Idee (`/ideas/[id]`) werden alle Kommentare chronologisch angezeigt
- [ ] Kommentare sind öffentlich lesbar (kein Login nötig)
- [ ] Nur eingeloggte Nutzer sehen das Kommentar-Eingabefeld
- [ ] Das Kommentar-Formular enthält: Textfeld (Pflichtfeld, max. 500 Zeichen) + Absenden-Button
- [ ] Nach erfolgreichem Kommentieren erscheint der Kommentar sofort in der Liste
- [ ] Jeder Kommentar zeigt: Nutzername, Zeitstempel (relative Zeit z.B. "vor 2 Stunden"), Kommentartext
- [ ] Nutzer können nur ihre eigenen Kommentare löschen
- [ ] Admin kann alle Kommentare löschen
- [ ] Kommentar-Anzahl auf der Idee-Card im Feed wird aktualisiert
- [ ] Leerer Kommentar-Bereich zeigt "Noch keine Kommentare — sei der Erste!"

## Edge Cases
- Was passiert, wenn ein Kommentar leer oder nur Leerzeichen enthält? → Validierungsfehler, kein Absenden
- Was passiert bei XSS-Versuchen im Kommentartext? → Eingaben werden serverseitig bereinigt
- Was passiert, wenn eine Idee gelöscht wird? → Alle zugehörigen Kommentare werden kaskadierend gelöscht (DB-Constraint)
- Was passiert, wenn der Nutzer während des Schreibens ausgeloggt wird? → Fehlermeldung beim Absenden, Formularinhalt bleibt erhalten
- Was passiert bei sehr vielen Kommentaren (>50)? → Pagination oder "Mehr laden"-Button (MVP: alle laden)

## Technical Requirements
- API Routes: `POST /api/ideas/[id]/comments`, `DELETE /api/comments/[id]`
- Supabase-Tabelle `comments`: Felder `id, idea_id, user_id, content, created_at`
- RLS Policy: Alle können lesen; eingeloggte Nutzer schreiben; Nutzer löscht nur eigene; Admin löscht alle
- Kaskadierendes Löschen: `ON DELETE CASCADE` bei `idea_id` FK

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
