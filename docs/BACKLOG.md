# Backlog (GitHub-ready)

Create one GitHub **Milestone** per section and one **Issue** per item. Suggested labels:
`area:auth`, `area:onboarding`, `area:directory`, `area:scheduling`, `area:video`, `area:concierge`,
`area:safety`, `type:feature`, `type:infra`, `priority:p0|p1|p2`.

## M0 — Foundation
- [ ] **#1 Scaffold Next.js + TS + Tailwind + shadcn/ui + Prisma + CI** (lint, typecheck, test on PR) — p0
- [ ] **#2 Design tokens & app shell**: Indeed-inspired light theme, subtle blue accent, top nav, responsive 3-column layout primitive — p0
- [ ] **#3 Prisma schema v1** from `ARCHITECTURE.md` + seed script with 30 fictional profiles — p0
- [ ] **#4 Role-based route guards** (member / consultant / admin) — p0

## M1 — Sign-in & Account
- [ ] **#5 Email magic-link sign-in** (Auth.js) — AC: verified email required before onboarding
- [ ] **#6 Google and Apple sign-in** — AC: accounts linked by verified email
- [ ] **#7 Age gate (18+) and DOB capture** — AC: under-18 blocked server-side
- [ ] **#8 ToS / privacy / guidelines acceptance** (versioned) — AC: re-prompt on version bump
- [ ] **#9 Account settings shell** (profile, availability, billing, notifications, delete account)

## M2 — Onboarding & Verification
- [ ] **#10 Resumable onboarding wizard** (steps 1–7) with per-step persistence
- [ ] **#11 ID/photo verification integration** (Stripe Identity or Persona) + webhook; status badge
- [ ] **#12 Photo upload** (signed S3/R2 uploads, reorder, primary, moderation hook)
- [ ] **#13 Preferences step** (age, distance, intentions)
- [ ] **#14 Availability setup step** (weekly windows, time zone, blocked dates)
- [ ] **#15 Profile builder (self-authored)** — all fields in spec §4, live preview, draft/publish
- [ ] **#16 Publish gating**: unverified or incomplete profiles never appear in directory

## M3 — Directory & Profiles
- [ ] **#17 Directory API** with all filters + pagination + geo distance
- [ ] **#18 Three-column directory UI** (filters | cards | detail pane); mobile sheet/route variants
- [ ] **#19 Profile detail view** with career de-emphasized, photo gallery, CTA, Available Now badge
- [ ] **#20 Save / unsave profiles** + Saved page
- [ ] **#21 URL-encoded filter state** and empty/loading/error states
- [ ] **#22 Block and report** from card, detail, and call

## M4 — Scheduling
- [ ] **#23 Slot generation** from rules − blocked − existing appointments, time-zone aware
- [ ] **#24 Request flow**: pick slot → hold → notify recipient — AC: concurrent requests cannot double-book (test)
- [ ] **#25 Recipient review screen** (requester profile + Accept / Decline / Propose another time)
- [ ] **#26 Reschedule & cancel with fixed-reason enum** (no free text)
- [ ] **#27 Hold expiry & stale-request job**
- [ ] **#28 Reminders** (24h, 1h, 5 min) via email + push; ICS invite
- [ ] **#29 Schedule page**: calendar view, upcoming, requests, availability editor

## M5 — Video Introductions
- [ ] **#30 Video provider integration**: room creation, token endpoint, server-enforced 300s limit
- [ ] **#31 Video room UI**: countdown, camera/mic, end, connection status, 1-minute warning, auto-end
- [ ] **#32 No-show detection & handling**
- [ ] **#33 Post-call private interest signal** (Interested / Not interested)
- [ ] **#34 Match creation** on mutual YES only; neutral outcome copy

## M6 — Available Now
- [ ] **#35 Activate/deactivate Available Now** (15/30/60) with expiry job — AC: login never sets availability
- [ ] **#36 Available Now directory** with filters and green indicator
- [ ] **#37 Request Call Now** (realtime/push, 60s window, accept/decline/timeout)
- [ ] **#38 Concurrency rules**: one live request per user; in-call suspends availability

## M7 — Messaging Gate
- [ ] **#39 Policy layer `canMessage`** + DB-level guard; tests proving no path to message pre-match
- [ ] **#40 Introductions hub** (requests, upcoming, completed)
- [ ] **#41 Unlocked conversation UI** (only for matches)
- [ ] **#42 Notification center** (structured events only pre-match)

## M8 — Profile Concierge
- [ ] **#43 Concierge marketing section** in onboarding step 3 and Settings (exact copy in spec §7)
- [ ] **#44 Stripe checkout $50** + webhook → `ConciergeOrder = PAID`; idempotent
- [ ] **#45 Consultation scheduling** (15-min slots from consultant calendars) + video room
- [ ] **#46 Consultant dashboard**: queue, notes, schedule — AC: staff-only, audit-logged access
- [ ] **#47 Draft editor**: bio/fields + photo selection from member's existing uploads only
- [ ] **#48 Member review & approval**: approve / request changes; publish only on approve
- [ ] **#49 Post-publish editing** by member; refund action for admin

## M9 — Trust, Safety, Launch
- [ ] **#50 Admin moderation queue** (reports, photo review, verification failures)
- [ ] **#51 Rate limits & abuse controls** on requests
- [ ] **#52 Data export & account deletion**
- [ ] **#53 Accessibility audit (WCAG 2.1 AA)**
- [ ] **#54 E2E tests** (Playwright): signup → onboarding → request → accept → call → mutual interest → message
- [ ] **#55 Observability** (error tracking, PII-safe logs), staging + production environments

## Suggested first sprint
#1, #2, #3, #5, #7, #10, #11 — gives you working sign-in and an onboarding shell into an empty portal.

## Issue template
```
**Context:** link to PRODUCT_SPEC section
**Task:** …
**Acceptance criteria:** …
**Out of scope:** …
**Tests required:** unit / integration / e2e
```
