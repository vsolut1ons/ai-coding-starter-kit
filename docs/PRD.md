# Product Requirements Document

## Vision
Ein eigenständiges Product-Feedback-Board, auf dem registrierte Nutzer der bestehenden Aktienportfolio-App Produktideen einreichen und per Upvote priorisieren können. Die App hat ein eigenes Supabase-Backend (unabhängig von der Portfolio-App) und hilft dem Produktteam, nutzerzentrierte Entscheidungen auf Basis echter Nutzerpräferenzen zu treffen.

## Target Users

**Primäre Nutzer:** Bestehende Nutzer der Aktienportfolio-Tracker-App
- Möchten Einfluss auf die Weiterentwicklung des Produkts nehmen
- Wollen sehen, welche Ideen die Community bevorzugt
- Sind technikaffin und gewohnt, sich in Web-Apps zu bewegen

**Admin (Produkteigentümer):**
- Verwaltet den Status von Ideen (Planned / In Progress / Done)
- Moderiert Inhalte (löscht unangemessene Ideen/Kommentare)
- Hat vollen Überblick über alle eingereichten Ideen und Votes

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | User Authentication (Registrierung & Login) | Planned |
| P0 (MVP) | Idea Feed (Öffentliches Board mit Sortierung) | Planned |
| P0 (MVP) | Idea Submission (Idee einreichen) | Planned |
| P0 (MVP) | Idea Voting (Upvote-System) | Planned |
| P1 | Comments (Kommentare unter Ideen) | Planned |
| P1 | Admin Panel (Status & Moderation) | Planned |

## Success Metrics
- Anzahl eingereichter Ideen (Ziel: > 10 in ersten 30 Tagen)
- Anteil aktiver Wähler (Ziel: > 50% der registrierten Nutzer stimmen ab)
- Admin nutzt Statussystem aktiv (mindestens 1 Statusänderung pro Woche)
- Keine kritischen Bugs in Produktion nach Deployment

## Constraints
- Solo-Entwickler: Features müssen einfach und direkt umsetzbar sein
- Eigenes Supabase-Backend (Free Tier), getrennt von der Portfolio-App
- Deployment auf Vercel (Free Tier)
- Next.js 16 App Router + TypeScript + Tailwind + shadcn/ui

## Non-Goals
- Keine Integration mit dem bestehenden Portfolio-App-Backend
- Kein Single-Sign-On (SSO) mit der Portfolio-App
- Kein E-Mail-Benachrichtigungssystem (MVP)
- Keine mobile App (nur responsive Web)
- Kein Punkte- oder Belohnungssystem
- Kein öffentlicher API-Zugang für externe Entwickler

---
