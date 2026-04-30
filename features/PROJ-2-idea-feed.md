# PROJ-2: Idea Feed (Öffentliches Board)

## Status: Planned
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

## Dependencies
- Requires: PROJ-1 (User Authentication) — für das Anzeigen des Login-Status und die Weiterleitung zur Einreichung

## User Stories
- As a visitor, I want to see a list of all submitted ideas so that I can understand what others are requesting.
- As a user, I want to sort ideas by number of votes so that I can see the most popular ideas first.
- As a user, I want to sort ideas by newest so that I can see recent submissions.
- As a user, I want to filter ideas by status (Planned / In Progress / Done / All) so that I can see what the team is working on.
- As a user, I want to click on an idea to see its full description and comments so that I can read more details.
- As a user, I want to see how many votes and comments each idea has in the list view so that I can quickly assess popularity.

## Acceptance Criteria
- [ ] Die Hauptseite (`/`) zeigt alle eingereichten Ideen als Liste/Cards
- [ ] Jede Idee-Card zeigt: Titel, Kurzbeschreibung (max. 150 Zeichen), Vote-Anzahl, Kommentar-Anzahl, Status-Badge
- [ ] Standardsortierung: nach Votes absteigend
- [ ] Nutzer kann zwischen "Top" (nach Votes) und "Neu" (nach Datum) sortieren
- [ ] Nutzer kann nach Status filtern: Alle / Planned / In Progress / Done
- [ ] Klick auf eine Idee-Card öffnet die Detailseite (`/ideas/[id]`)
- [ ] Die Liste ist auch ohne Login sichtbar (öffentlich lesbar)
- [ ] Leerer Zustand: Wenn keine Ideen vorhanden, wird eine freundliche Meldung angezeigt
- [ ] Die Seite lädt schnell (Server-Side Rendering oder Static Generation)
- [ ] Auf mobilen Geräten ist die Liste vollständig nutzbar (responsive)

## Edge Cases
- Was passiert, wenn es sehr viele Ideen gibt (>100)? → Pagination oder Infinite Scroll
- Was passiert, wenn eine Idee gelöscht wurde, während der Nutzer sie geöffnet hat? → 404-Seite mit Zurück-Link
- Was passiert, wenn der Filter keine Ergebnisse liefert? → "Keine Ideen in dieser Kategorie"-Meldung
- Was passiert bei sehr langen Titeln? → Text-Truncation mit `...`

## Technical Requirements
- Server-Side Rendering für SEO und schnelle erste Ladezeit
- Pagination: max. 20 Ideen pro Seite (MVP)
- Status-Badge Farben: Planned (grau), In Progress (blau), Done (grün)

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
