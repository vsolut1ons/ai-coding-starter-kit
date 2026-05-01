# PROJ-3: Idea Submission (Idee einreichen)

## Status: In Progress
**Created:** 2026-04-30
**Last Updated:** 2026-05-01

## Implementation Notes
- Backend implementiert (2026-05-01)
- API Route: `POST /api/ideas` — `src/app/api/ideas/route.ts`
- Zod-Validierung: Titel (max. 100), Beschreibung (max. 1000), Whitespace-Trim
- Case-insensitive Duplikat-Check via `.ilike()` auf Titel
- `author_id` wird aus Server-Session gesetzt (nie vom Client)
- Fehlerbehandlung: 401 (unauthenticated), 400 (validation), 409 (duplicate), 500 (DB error)
- Tests: `src/app/api/ideas/route.test.ts` (11 Tests) — alle grün (37/37 gesamt)

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

### Component Structure

```
/ (Home Page — Feed)
+-- Navbar (bestehend)
|   +-- "Idee einreichen" Button          ← NEU
|       → nicht eingeloggt: Redirect zu /login?next=/
|       → eingeloggt: öffnet SubmitIdeaDialog
+-- SubmitIdeaDialog (Modal)              ← NEU
    +-- Titel-Input (max. 100 Zeichen)
    |   +-- CharacterCounter (Echtzeit: "23/100")
    +-- Beschreibungs-Textarea (max. 1000 Zeichen)
    |   +-- CharacterCounter (Echtzeit: "142/1000")
    +-- ErrorAlert (Validierung / Duplikat-Hinweis)
    +-- Submit-Button (mit Loading-State)

POST /api/ideas                           ← Neue API-Route
```

### Nutzerfluss

```
Besucher (nicht eingeloggt)
  → klickt "Idee einreichen"
  → wird zu /login?next=/ weitergeleitet
  → nach Login: zurück zum Feed

Eingeloggter Nutzer
  → klickt "Idee einreichen"
  → Modal öffnet sich
  → füllt Titel + Beschreibung aus
  → sieht Zeichenzähler in Echtzeit
  → klickt "Einreichen"
  → Erfolg: Modal schließt, Toast "Idee eingereicht!", Feed lädt neu
  → Duplikat: Fehlermeldung mit Link zur bestehenden Idee
  → Netzwerkfehler: Fehlermeldung, Formulardaten bleiben erhalten
```

### Datenmodell

Keine Änderungen an der `ideas`-Tabelle nötig (aus PROJ-2). Bei Einreichung:

```
title         → aus dem Formular (max. 100 Zeichen, getrimmt)
description   → aus dem Formular (max. 1000 Zeichen)
status        → automatisch "Planned"
vote_count    → automatisch 0
comment_count → automatisch 0
author_id     → aus der Server-Session (nie vom Client übertragen)
created_at    → automatisch (Datenbankzeit)
```

### API

```
POST /api/ideas
  1. Session prüfen → kein User = 401
  2. Zod-Validierung (Titel, Beschreibung, Längen, Whitespace-Trim)
  3. Case-insensitive Duplikat-Check auf Titel
  4. author_id aus Server-Session setzen
  5. In Supabase ideas-Tabelle einfügen
  6. Erfolg: 201 + neue Idee zurückgeben
  7. Duplikat: 409 + id der bestehenden Idee
```

### Tech-Entscheidungen

| Entscheidung | Gewählt | Warum |
|---|---|---|
| Formular-Platzierung | Modal (Dialog) | Nutzer bleibt auf Feed, bessere UX |
| Nach Einreichung | Redirect zum Feed (SSR) | Einfacher, Feed zeigt sofort echte DB-Daten |
| Validierung | react-hook-form + Zod (client + server) | Schnelles Feedback + Sicherheit |
| Duplikat-Check | DB-Abfrage im API (case-insensitive) | Zuverlässiger als Client-Check |
| Toast | shadcn/ui Sonner (bereits installiert) | Kein neues Package nötig |
| Button-Platzierung | Navbar | Maximale Sichtbarkeit auf allen Seiten |

### Neue Abhängigkeiten

Keine — react-hook-form, zod, Dialog, Sonner, Textarea bereits installiert.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
