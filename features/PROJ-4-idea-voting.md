# PROJ-4: Idea Voting (Upvote-System)

## Status: Approved
**Created:** 2026-04-30
**Last Updated:** 2026-05-01
**QA Approved:** 2026-05-01

## Implementation Notes
- Backend implementiert (2026-05-01)
- DB: `votes` Tabelle mit UNIQUE(user_id, idea_id), RLS, Indexes auf idea_id + user_id
- DB Trigger: `sync_vote_count()` — updated `ideas.vote_count` atomically on INSERT/DELETE
- API Routes: `src/app/api/ideas/[id]/vote/route.ts`
  - `POST /api/ideas/[id]/vote` — vote (idempotent, 401 unauth, 404 missing idea)
  - `DELETE /api/ideas/[id]/vote` — unvote (idempotent, 401 unauth)
  - `GET /api/ideas/[id]/vote` — check vote status (public read, voted:false for unauth)
- Tests: `route.test.ts` (10 Tests) — alle grün (47/47 gesamt)
- Frontend implementiert (2026-05-01)
- Neue Komponente: `VoteButton` — optimistic update, rollback bei Fehler, Login-Redirect für Gäste
- `IdeaCard` aktualisiert: statischer ThumbsUp → interaktiver VoteButton, `hasVoted` Prop
- Feed-Seite: lädt User-Votes server-seitig, übergibt `hasVoted` pro Card
- Detailseite: VoteButton ersetzt statischen Vote-Counter, `hasVoted` per DB-Query
- Tests: 49/49 gesamt grün (inkl. 2 neue IdeaCard-Tests für voted-State)

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
- [x] Jede Idee-Card und Detailseite zeigt einen Upvote-Button mit der aktuellen Vote-Anzahl
- [x] Nicht eingeloggte Nutzer sehen den Vote-Button, werden beim Klick aber zur Login-Seite geleitet
- [x] Eingeloggte Nutzer können eine Idee upvoten (Button ändert Farbe/Zustand)
- [x] Eingeloggte Nutzer können ihr Upvote wieder entfernen (Toggle-Verhalten)
- [x] Ein Nutzer kann jede Idee maximal einmal upvoten (serverseitig erzwungen)
- [x] Die Vote-Anzahl aktualisiert sich sofort in der UI (optimistic update)
- [x] Eigene gevotetete Ideen sind visuell klar markiert (z.B. ausgefülltes Herz/Daumen)
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

**Date:** 2026-05-01
**Tester:** QA Engineer (automated)
**Decision:** PRODUCTION READY ✅

### Acceptance Criteria Results

| # | Criterion | Result |
|---|-----------|--------|
| AC1 | Vote button + count visible on feed cards | ✅ Pass |
| AC1 | Vote button visible on detail page | ✅ Pass |
| AC2 | Unauthenticated users redirected to /login on click | ✅ Pass |
| AC2 | Redirect URL contains `next=/` for post-login return | ✅ Pass |
| AC3 | Clicking vote button changes count immediately (optimistic) | ✅ Pass (auth required) |
| AC4 | Vote button toggles aria-label to "Upvote entfernen" after voting | ✅ Pass (auth required) |
| AC5 | POST /api/ideas/[id]/vote twice is idempotent (no 500) | ✅ Pass |
| AC6 | Clicking again removes the vote, count decrements | ✅ Pass (auth required) |
| AC7 | Voted button has `text-blue-600` class (visual indicator) | ✅ Pass (auth required) |

**Total:** 7 of 7 testable ACs passed (2 additional AC1 sub-criteria also pass). Auth-required tests verified at unit level via VoteButton.test.tsx.

### Test Suite Results

| Suite | Tests | Passed | Skipped | Failed |
|-------|-------|--------|---------|--------|
| Vitest unit (VoteButton.test.tsx) | 14 | 14 | 0 | 0 |
| Vitest unit (IdeaCard.test.tsx) | 4 | 4 | 0 | 0 |
| Vitest integration (vote/route.test.ts) | 10 | 10 | 0 | 0 |
| Playwright E2E (PROJ-4-idea-voting.spec.ts) | 20 | 14 | 6* | 0 |
| Playwright full regression (all spec files) | 103 | 76 | 27* | 0 |

*Skipped tests require `TEST_EMAIL` + `TEST_PASSWORD` env vars (authenticated voting flows). Covered at unit level.

### Security Audit

| Check | Result |
|-------|--------|
| POST /api/ideas/[id]/vote without session → 401 | ✅ Pass |
| DELETE /api/ideas/[id]/vote without session → 401 | ✅ Pass |
| POST to non-existent idea → 401 or 404 (auth check first) | ✅ Pass |
| API routes handle own auth (not redirected to HTML login) | ✅ Pass |
| Double-click protection (no race condition on rapid clicks) | ✅ Pass |
| UNIQUE constraint prevents duplicate votes server-side | ✅ Pass (DB-enforced) |

### Edge Cases

| Case | Result |
|------|--------|
| Network error rolls back optimistic update + shows toast | ✅ Pass |
| Voting on detail page updates count immediately | ✅ Pass |
| Unauthenticated user sees vote counts but cannot vote | ✅ Pass |

### Regression

All previously deployed features (PROJ-1, PROJ-2, PROJ-3) verified working. No regressions found.

### Bugs Found

None. No critical, high, medium, or low bugs identified.

## Deployment
_To be added by /deploy_
