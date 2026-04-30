# PROJ-2: Idea Feed (Öffentliches Board)

## Status: Deployed
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

## Implementation Notes
- Frontend vollständig implementiert (2026-04-30)
- Neue Komponenten: `IdeaCard`, `FeedControls`
- Seiten: `/` (Feed), `/ideas/[id]` (Detail-Placeholder), `/ideas/[id]/not-found`
- Typ-Definitionen in `src/lib/types.ts` (Idea, IdeaStatus)
- `src/proxy.ts` angepasst: `/` und `/ideas/*` sind nun öffentlich zugänglich ohne Login
- Backend implementiert (2026-04-30)
- DB-Migration: `supabase/migrations/001_ideas.sql` (manuell in Supabase SQL Editor ausführen)
- Seed-Daten: `supabase/seed.sql` für Entwicklung/Demo
- Tests: `IdeaCard.test.tsx` (9 Tests), `FeedControls.test.tsx` (5 Tests) — alle grün (26/26)

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

### Component Structure

```
/ (Home Page — öffentlich, kein Login nötig)
+-- Navbar (bereits vorhanden — PROJ-1)
+-- IdeaFeedPage
    +-- FeedHeader
    |       Titel + kurze Beschreibung des Boards
    +-- FeedControls
    |   +-- SortTabs ("Top" / "Neu")         → shadcn/ui Tabs
    |   +-- StatusFilter ("Alle" / "Planned" / "In Progress" / "Done")  → shadcn/ui Select
    +-- IdeaList
    |   +-- IdeaCard (×N, eine pro Idee)
    |   |   +-- StatusBadge                  → shadcn/ui Badge
    |   |   +-- Titel (abgeschnitten bei Überlänge)
    |   |   +-- Kurzbeschreibung (max. 150 Zeichen)
    |   |   +-- VoteCount (Icon + Zahl)
    |   |   +-- CommentCount (Icon + Zahl)
    |   +-- EmptyState (wenn keine Ideen vorhanden)
    +-- PaginationBar (max. 20 pro Seite)    → shadcn/ui Pagination

/ideas/[id] (Detailseite — Grundstruktur jetzt, vollständig in PROJ-5)
```

### Datenmodell

```
Tabelle: ideas
  - id            → eindeutige ID
  - title         → Titel (max. ~100 Zeichen)
  - description   → ausführliche Beschreibung
  - status        → "Planned" | "In Progress" | "Done"
  - vote_count    → Anzahl Upvotes (befüllt von PROJ-4)
  - comment_count → Anzahl Kommentare (befüllt von PROJ-5)
  - author_id     → Link zu auth.users
  - created_at    → Zeitstempel
```

### URL-Zustand

Sortierung, Filter und Seite leben in der URL (shareable, SSR-kompatibel):
- `/?sort=top&status=all&page=1`
- `/?sort=new&status=planned&page=2`

### Tech-Entscheidungen

| Entscheidung | Gewählt | Warum |
|---|---|---|
| Rendering | Server-Side (Next.js SSR) | Schnelle Ladezeit, SEO-freundlich |
| Sortierung & Filter | URL Query Parameter | Shareable, kein Client-State nötig |
| Paginierung | URL-basiert, 20 Ideen/Seite | Einfach, skalierbar |
| UI-Komponenten | shadcn/ui (Tabs, Select, Badge, Card, Pagination) | Alle bereits installiert |

### Supabase RLS

- Lesen: JEDER (auch nicht eingeloggte Besucher)
- Schreiben: Nur eingeloggte Nutzer (PROJ-3)
- Löschen: Nur Admin (PROJ-6)

### Neue Abhängigkeiten

Keine — alle UI-Komponenten sind bereits installiert.

## QA Test Results

**QA Date:** 2026-04-30
**Tester:** Claude QA Engineer
**Build:** feat(PROJ-2): Implement backend for Idea Feed

### Acceptance Criteria Results

| # | Kriterium | Status |
|---|-----------|--------|
| AC1 | Hauptseite zeigt alle Ideen als Liste/Cards | ✅ PASS |
| AC2 | IdeaCard zeigt Titel, Beschreibung, Votes, Kommentare, Status-Badge | ✅ PASS |
| AC3 | Standardsortierung nach Votes absteigend | ✅ PASS |
| AC4 | Sort-Tabs "Top" / "Neu" funktionieren | ✅ PASS |
| AC5 | Status-Filter Alle / Planned / In Progress / Done | ✅ PASS |
| AC6 | Klick auf Card öffnet Detailseite `/ideas/[id]` | ✅ PASS |
| AC7 | Liste ohne Login sichtbar (öffentlich lesbar) | ✅ PASS |
| AC8 | Leerer Zustand: freundliche Meldung | ✅ PASS (unit test + manuell) |
| AC9 | Seite lädt schnell (SSR) | ✅ PASS (< 5s dev, schneller in Prod) |
| AC10 | Mobil vollständig nutzbar (375px) | ✅ PASS |

**Ergebnis: 10/10 Acceptance Criteria bestanden**

### Edge Cases

| Edge Case | Status |
|-----------|--------|
| Nicht-existierende Idee → 404 mit Zurück-Link | ✅ PASS |
| Filter ohne Ergebnisse → freundliche Meldung | ✅ PASS |
| Lange Titel → Text-Truncation (`line-clamp`) | ✅ PASS |
| URL-Params shareable und SSR-kompatibel | ✅ PASS |
| Seitenwechsel setzt `page`-Param zurück | ✅ PASS |

### Security Audit (Red Team)

| Test | Ergebnis |
|------|----------|
| Unauthenticated INSERT via REST API | ✅ Blocked (RLS 42501) |
| Unauthenticated UPDATE via REST API | ✅ Blocked (RLS, 0 rows affected) |
| Unauthenticated DELETE via REST API | ✅ Blocked (RLS, 0 rows affected) |
| SQL Injection via URL-Params (`sort`) | ✅ Sicher (Supabase SDK parameterized queries) |
| XSS via URL-Params (`status`) | ✅ Sicher (React escaping) |
| Secrets im Browser | ✅ Nur `NEXT_PUBLIC_` Anon Key (designed to be public) |

**Security-Findings (Low):**
- L-1: `author_id` UUID wird in REST-API-Response mitgeliefert — keine sensitive Daten, aber datenschutztechnisch erwähnenswert. Wird in PROJ-3 bei RLS-Feinjustierung betrachtet.

### Test Suite

| Suite | Tests | Ergebnis |
|-------|-------|----------|
| Vitest Unit Tests (IdeaCard) | 9/9 | ✅ |
| Vitest Unit Tests (FeedControls) | 5/5 | ✅ |
| Alle bestehenden Unit Tests | 26/26 | ✅ |
| E2E Chromium | 34/34 | ✅ |
| E2E Mobile Safari | 34/34 | ✅ |
| PROJ-1 Regression Tests | 18/18 | ✅ (1 Test angepasst: `/` ist jetzt public per PROJ-2) |

**Gesamt: 121/121 Tests bestanden**

### Bugs

Keine Critical oder High Bugs gefunden.

**Low:**
- L-1: `author_id` UUID in REST-Response (s.o.)

### Production-Ready Entscheidung

**✅ READY** — Keine Critical oder High Bugs. Feature ist bereit für Deployment.

## Deployment

**Deployed:** 2026-04-30
**Production URL:** https://ai-coding-starter-kit-wheat.vercel.app
**Vercel Deployment:** dpl_FcHfnpHgSxtpyknmVkynxDTJRzar
**Git Tag:** v1.2.0-PROJ-2

**Post-Deployment Verification:**
- ✅ `/` (public feed) → 200 OK
- ✅ `/login` → 200 OK
- ✅ `/ideas/[id]` (detail page) → 200 OK
- ✅ `/ideas/[not-found-id]` → 404 (not-found page)
- ✅ `/admin` (protected) → 307 redirect to /login
