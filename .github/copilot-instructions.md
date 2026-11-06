# Copilot / Coding Agent Instructions

You are building a professional, video-first dating platform. Read `docs/PRODUCT_SPEC.md` and
`docs/ARCHITECTURE.md` before changing code.

## Hard rules (never violate; add tests when touching related code)
- No swipe gestures or swipe UI anywhere.
- Server-side enforcement: a `Conversation`/message may only be created when a `VideoIntro` between the
  two users has `status = COMPLETED` AND both users have an `InterestSignal = YES` for each other.
  Never enforce this in the UI only.
- Pre-intro communication uses structured `AppointmentEvent` records only. No free-text fields between users
  before unlock. Reschedule reasons are a fixed enum.
- Intro call length is 300 seconds, enforced by the server (token expiry + room auto-close), not just a client timer.
- No extension feature in v1.
- "Available Now" requires explicit activation with a duration of 15, 30, or 60 minutes and expires automatically.
  Login/session state must never set availability.
- Time slots are reserved transactionally; double-booking must be impossible (DB unique constraint + transaction).
- Profile Concierge: never publish a concierge-written profile until the member has approved it. No photo sessions;
  only photos the member has already uploaded.
- Users must be 18+ and verified before appearing in the directory.

## Conventions
- TypeScript strict. Zod validation on every API input. Prisma for data access.
- Store all times in UTC; render in the user's time zone.
- Indeed-inspired UI: white/light neutral background, subtle blue accent, 3-column desktop layout
  (filters | results | detail), single column on mobile. Do not copy any third-party logos or assets.
- Accessibility: WCAG 2.1 AA, keyboard navigable, visible focus states.
- Never log PII, ID-verification results, or payment details.
- Every PR: tests for new logic, updated docs if behavior changes.
