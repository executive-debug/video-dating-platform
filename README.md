# [PRODUCT_NAME] — Professional Video-First Dating Platform

> "Five minutes to connect. The rest is up to you."

A non-swipe, appointment-based dating platform for career-driven professionals.
Browse a searchable directory (Indeed-style), read structured profiles (LinkedIn-style),
and book five-minute video introductions (Calendly-style). No messaging until you've met on video.

## Repo docs

| File | Purpose |
|---|---|
| [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) | What we're building: rules, flows, acceptance criteria |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, data model, state machines, API surface |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | Milestones and GitHub-ready issues, in build order |
| [`.github/copilot-instructions.md`](.github/copilot-instructions.md) | Guardrails for Copilot / coding agents |

## Stack (v1)

Next.js (App Router, TypeScript) · Postgres + Prisma · Auth.js · Stripe · Daily or LiveKit (WebRTC) ·
Postmark/Resend (email) · Persona or Stripe Identity (ID/age verification) · Tailwind + shadcn/ui · Playwright + Vitest.

## Getting started

```bash
cp .env.example .env            # set DATABASE_URL and AUTH_SECRET
npm install
npx prisma migrate deploy       # applies schema + hand-written DB constraints
npm run db:seed                 # 30 fictional profiles
npm run dev
```

With `EMAIL_SERVER` unset (development only) the magic sign-in link is printed to the server console.
Checks run in CI: `npm run lint`, `npm run typecheck`, `npm test` (DB-backed tests run when `DATABASE_URL` is set).

## Non-negotiable product rules

1. No swiping, ever.
2. No free-form messaging before a completed video introduction **and** mutual interest.
3. Pre-intro communication is limited to structured appointment events.
4. Intro calls are exactly 5 minutes, auto-end, no extension in v1.
5. Being logged in never implies "Available Now"; it must be explicitly activated and expires.
6. Profile Concierge is optional, $50 one-time, uses existing member photos only, and nothing publishes without member approval.
