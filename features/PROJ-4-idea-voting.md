# PROJ-4: Idea Voting (Upvote-System)

## Status: Planned
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

## Dependencies
- Requires: PROJ-1 (User Authentication) — nur eingeloggte Nutzer dürfen abstimmen
- Requires: PROJ-2 (Idea Feed) — Votes werden im Feed angezeigt
- Requires: PROJ-3 (Idea Submission) — Ideen müssen existieren, um abzustimmen

## User Stories
- As a logged-in user, I want to upvote an idea so that I can signal that I support it.
- As a logged-in user, I want to remove my upvote so that I can change my mind.
- As a visitor (not logged in), I want to see the vote count of each idea so that I can assess popularity without logging in.
- As a visitor, I want to be prompted to log in when I try to vote so that I understand why I can't proceed.
- As a logged-in user, I want to see which ideas I have already voted on so that I don't lose track.

## Acceptance Criteria
- [ ] Jede Idee-Card und Detailseite zeigt einen Upvote-Button mit der aktuellen Vote-Anzahl
- [ ] Nicht eingeloggte Nutzer sehen den Vote-Button, werden beim Klick aber zur Login-Seite geleitet
- [ ] Eingeloggte Nutzer können eine Idee upvoten (Button ändert Farbe/Zustand)
- [ ] Eingeloggte Nutzer können ihr Upvote wieder entfernen (Toggle-Verhalten)
- [ ] Ein Nutzer kann jede Idee maximal einmal upvoten (serverseitig erzwungen)
- [ ] Die Vote-Anzahl aktualisiert sich sofort in der UI (optimistic update)
- [ ] Eigene gevotetete Ideen sind visuell klar markiert (z.B. ausgefülltes Herz/Daumen)
- [ ] Nutzer kann nicht für seine eigene eingereichte Idee abstimmen (optional für MVP, dokumentiert als Edge Case)

## Edge Cases
- Was passiert bei einem Netzwerkfehler beim Voten? → Optimistic Update wird zurückgerollt, Fehlermeldung
- Was passiert bei schnellen Doppelklicks (Race Condition)? → Debounce oder Server-seitige Idempotenz (unique constraint in DB)
- Was passiert, wenn eine Idee gelöscht wird während jemand abstimmt? → Fehlermeldung "Idee nicht mehr verfügbar"
- Was passiert, wenn ein Nutzer versucht, per direktem API-Aufruf doppelt zu voten? → UNIQUE constraint in Supabase verhindert Duplikate

## Technical Requirements
- API Route: `POST /api/ideas/[id]/vote` (upvote) und `DELETE /api/ideas/[id]/vote` (unvote)
- Supabase-Tabelle `votes`: unique constraint auf `(user_id, idea_id)`
- RLS Policy: Nutzer darf nur eigene Votes lesen/schreiben/löschen
- Vote-Anzahl: Computed via COUNT in der ideas-Abfrage (kein separates Feld, das desynchronisiert)

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
