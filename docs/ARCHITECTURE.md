# Architecture

## Stack
- **App:** Next.js (App Router) + TypeScript, deployed on Vercel (or any Node host).
- **DB:** Postgres (Neon/Supabase/RDS) via Prisma. Postgres is also the source of truth for slot locking.
- **Auth:** Auth.js (email magic link, Google, Apple). Database sessions.
- **Payments:** Stripe (Checkout for the $50 Concierge, webhooks for fulfillment).
- **Video:** Daily or LiveKit; server issues short-lived room tokens.
- **Realtime:** SSE or provider pub/sub for notifications and Available Now changes.
- **Jobs:** Inngest / Trigger.dev / cron for reminders, hold expiry, Available Now expiry.
- **Email/push:** Resend or Postmark; web push for "Call Now".
- **Verification:** Stripe Identity or Persona.
- **Storage:** S3/R2 for photos, with signed uploads and image moderation.
- **UI:** Tailwind + shadcn/ui. **Tests:** Vitest, Playwright.

## Suggested repo layout
```
/app
  (marketing)/            landing, pricing
  (auth)/sign-in, sign-up
  onboarding/[step]
  (portal)/discover, available-now, schedule, saved, introductions, profile, settings
  (portal)/room/[appointmentId]
  consultant/             staff dashboard (role-guarded)
  admin/
  api/                    route handlers + webhooks
/lib  (auth, db, policy, scheduling, video, notifications)
/prisma/schema.prisma
/docs
/tests
```

## Core data model (Prisma sketch)

```
User(id, email, role[MEMBER|CONSULTANT|ADMIN], dob, verificationStatus, createdAt)
Profile(userId, firstName, bio, occupation, industry, education, city, geo, intentions[], values[],
        interests[], lifestyle, wellness, familyGoals, religion, status[DRAFT|PENDING_APPROVAL|PUBLISHED|HIDDEN],
        authoredBy[SELF|CONCIERGE])
Photo(id, userId, url, order, isPrimary, moderationStatus)
Preference(userId, ageMin, ageMax, distanceKm, filters JSON)
AvailabilityRule(userId, weekday, startMin, endMin, tz)
BlockedTime(userId, startsAt, endsAt)
AvailableNowSession(id, userId, startsAt, expiresAt, endedAt)      -- at most one active per user
SavedProfile(userId, savedUserId)

Appointment(id, requesterId, recipientId, startsAt, endsAt, kind[SCHEDULED|LIVE],
            status[REQUESTED|CONFIRMED|DECLINED|CANCELLED|RESCHEDULE_PROPOSED|COMPLETED|NO_SHOW|EXPIRED],
            roomId, holdExpiresAt)
  UNIQUE/EXCLUDE: no overlapping active appointments per participant (tstzrange exclusion constraint)
AppointmentEvent(id, appointmentId, actorId, type, reasonCode[enum], proposedStartsAt, createdAt)
VideoIntro(id, appointmentId, startedAt, endedAt, status)
InterestSignal(introId, fromUserId, toUserId, value[YES|NO])      -- private
Match(userAId, userBId, unlockedAt)                                -- created only on mutual YES after COMPLETED intro
Conversation(id, matchId) / Message(id, conversationId, senderId, body)   -- insert requires Match row

ConciergeOrder(id, userId, stripePaymentIntentId, status[PAID|SCHEDULED|CONSULTED|DRAFTED|APPROVED|REFUNDED], consultantId)
ConsultationAppointment(id, orderId, startsAt, roomId, status)
ConciergeDraft(id, orderId, profileSnapshot JSON, selectedPhotoIds[], version, status[DRAFT|SUBMITTED|CHANGES_REQUESTED|APPROVED])
ConsultantNote(id, orderId, body)                                  -- staff-only
AuditLog(id, actorId, action, entity, entityId, at)
Report / Block
```

## Key enforcement points (server-side)

1. **Messaging gate:** `canMessage(a,b)` = exists `Match`. Messages table insert guarded by policy function +
   DB check via FK to `Match`. No route exists to create a conversation otherwise.
2. **No double booking:** transaction + Postgres exclusion constraint on `(participant, tstzrange(startsAt, endsAt))`
   for active statuses. Holds count as active until `holdExpiresAt`.
3. **5-minute cap:** token `exp = start + 300s`; provider room `exp`/`max_duration`. Client timer is cosmetic.
4. **Available Now expiry:** `expiresAt` checked on every read; job cleans up. No heartbeat-based availability.
5. **Concierge publish gate:** `Profile.status` can only move to PUBLISHED from a draft with
   `ConciergeDraft.status = APPROVED` by the owner.
6. **Directory visibility:** only `verificationStatus = VERIFIED` and `Profile.status = PUBLISHED`.

## Appointment state machine
```
REQUESTED → CONFIRMED | DECLINED | RESCHEDULE_PROPOSED | EXPIRED
RESCHEDULE_PROPOSED → CONFIRMED | DECLINED | RESCHEDULE_PROPOSED (counter) | EXPIRED
CONFIRMED → COMPLETED | NO_SHOW | CANCELLED | RESCHEDULE_PROPOSED
```

## Concierge state machine
`PAID → SCHEDULED → CONSULTED → DRAFTED → (CHANGES_REQUESTED ↔ DRAFTED) → APPROVED → profile PUBLISHED`

## API surface (REST route handlers; all Zod-validated)
- `POST /api/onboarding/:step`
- `GET /api/directory?filters…` · `GET /api/profiles/:id` · `POST /api/saved`
- `GET /api/users/:id/slots` · `POST /api/appointments` · `POST /api/appointments/:id/{accept|decline|propose|cancel}`
- `POST /api/available-now` (duration) · `DELETE /api/available-now` · `GET /api/available-now/directory`
- `POST /api/appointments/live` (Call Now)
- `POST /api/rooms/:appointmentId/token`
- `POST /api/intros/:id/interest`
- `GET/POST /api/messages` (policy-gated)
- `POST /api/concierge/checkout` · `POST /api/webhooks/stripe` · `POST /api/concierge/:id/schedule`
- `GET/PATCH /api/consultant/orders/:id` · `POST /api/concierge/drafts/:id/{approve|request-changes}`

## Security / privacy
Encrypt sensitive fields at rest, signed photo URLs, rate limits (requests/day), CSRF protection,
Stripe webhook signature verification, role-based route guards (`middleware.ts`), audit logs for staff access,
GDPR/CCPA export + delete.
