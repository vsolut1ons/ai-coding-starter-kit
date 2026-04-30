# PROJ-2: Idea Feed (Öffentliches Board)

## Status: In Progress
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

## Implementation Notes
- Frontend vollständig implementiert (2026-04-30)
- Neue Komponenten: `IdeaCard`, `FeedControls`
- Seiten: `/` (Feed), `/ideas/[id]` (Detail-Placeholder), `/ideas/[id]/not-found`
- Typ-Definitionen in `src/lib/types.ts` (Idea, IdeaStatus)
- `src/proxy.ts` angepasst: `/` und `/ideas/*` sind nun öffentlich zugänglich ohne Login
- Datenbank-Tabelle `ideas` wird in `/backend` erstellt

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
_To be added by /qa_

## Deployment
_To be added by /deploy_
