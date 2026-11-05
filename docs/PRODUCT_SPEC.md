# Product Spec

Status: Draft v1. Source: two original B12 prompts (core platform + Profile Concierge), restructured for
implementation. Section 8 of the original core prompt was truncated; the rule below is the inferred intent
and **needs confirmation** (see Open Questions).

## 1. Principles

- Efficiency and intent over endless browsing and chatting.
- Professional, approachable, premium, trustworthy.
- Structured interactions replace open conversation until two people have met on video.

## 2. Personas / Roles

| Role | Description |
|---|---|
| Member | Verified adult user who browses, requests intros, and is requested. |
| Consultant | Staff user who serves Profile Concierge clients. |
| Admin | Staff user: moderation, verification review, refunds, consultant management. |

## 3. Member Journey

### 3.1 Sign-in and account creation
- Sign up with email (magic link or password) or Google / Apple.
- Email verification required.
- Age gate: must be 18+. Date of birth collected; under-18 is blocked.
- Terms, privacy, community guidelines acceptance (versioned, stored).

**Acceptance:** a user cannot reach onboarding step 2 without a verified email and DOB showing 18+.

### 3.2 Onboarding wizard (resumable; progress saved per step)

| Step | Content |
|---|---|
| 1. Basics | First name, DOB, city/location, time zone |
| 2. Verification | Photo/ID verification via provider. Status: PENDING / VERIFIED / FAILED |
| 3. Profile path | **Build My Own Profile** or **Let Us Build Your Profile — $50** (see §7) |
| 4. Photos | Upload photos (min 3, max 10 for v1), mark primary |
| 5. Preferences | Age range, distance, relationship intentions, dealbreakers |
| 6. Availability | Weekly availability windows, slot length (5 min intro + buffer), time zone |
| 7. Review and publish | Preview; publish only after verification = VERIFIED |

Rules:
- Members may skip step 3 choice by selecting build-my-own; they can buy Concierge later from Settings.
- If Concierge is chosen, step 4 uploads only; the consultant finalizes bio/photo selection, and the member
  approves before publication. Profile stays unpublished until then.
- Unverified members can complete onboarding but are not listed in the directory.

### 3.3 Portal (post-onboarding)
Top nav: **Discover · Available Now · Schedule · Saved · Introductions · Profile · Settings**.
"Introductions" holds requests, upcoming calls, and completed intros. Messaging appears here only for unlocked pairs.

## 4. Profiles

Fields: primary photo, additional photos, first name, age, city/region, occupation, industry, education (opt),
bio, interests/hobbies, lifestyle preferences, relationship intentions, personal values, fitness/wellness,
family goals (opt), religious preferences (opt), video-intro availability.

- Career is displayed but is visually secondary to bio, values, and intentions.
- Primary CTA: **Request 5-Minute Introduction**.
- Green **Available Now** badge when the user has an active availability window.
- No popularity metrics (no like counts, no rankings).

## 5. Directory (Indeed-style)

Desktop: left filters, center results list, right detail pane (selecting a card loads detail without a page
navigation). Mobile: filters in a sheet, detail as a full-screen route.

Filters: age range, location, distance, relationship intentions, occupation/industry, education,
lifestyle, shared interests, religious preferences, family goals, Available Now, accepts scheduled intros.

Card: photo, name + age, occupation, location, relationship goal, short description, availability indicator,
Save button.

**Acceptance:** filters are URL-encoded (shareable/back-button safe); results paginate; Save toggles without leaving the list.

## 6. Introductions

### 6.1 Scheduled introduction (Calendly-style)
1. Requester opens profile and clicks **Request 5-Minute Introduction**.
2. System shows the recipient's open slots (in requester's time zone).
3. Requester picks a slot. Slot is **held** for the recipient's decision window (24h or until slot start, whichever is sooner).
4. Recipient is notified (in-app + email), reviews the requester's profile, and responds:
   **Accept**, **Decline**, or **Propose Another Time**.
5. Accept → appointment CONFIRMED, slot reserved, calendar invite + reminders scheduled.
6. Decline → no conversation, slot released, requester notified with a neutral, templated message.

### 6.2 Reschedule / cancel (no messaging)
Fixed-option reasons only: "Something came up.", "Can we try another day?", "Request a different time.",
"Unavailable this week."
Other party can Accept / Decline / Propose another time. Cancel releases the slot and notifies the other party.

### 6.3 Video room
- Both join at the scheduled time (join opens 2 min early; no-show handling below).
- 5:00 countdown, camera toggle, mic toggle, end call, connection status indicator,
  "1 minute remaining" notice, automatic end at 5:00. No extension.
- Server enforces duration (room token TTL / provider room expiry).
- No-show: if one party hasn't joined after 3 min, appointment is marked NO_SHOW for that party; repeated no-shows
  affect visibility (admin-tunable).

### 6.4 Post-call: interest signal
After the call each person privately answers **Interested / Not interested**. Only mutual "Interested" unlocks
messaging (§9). A "Not interested" is never revealed as such; the other side sees a neutral "No match this time."

## 7. Profile Concierge (premium, optional)

- Price: **$50 one-time**, Stripe Checkout / Payment Element.
- Entry points: onboarding step 3 and Settings → Profile Concierge. Purchasable any time.
- Copy:
  - Headline: "You're more interesting than your dating profile."
  - Subheading: "You've built an incredible life. Let's build a profile that reflects it."
  - Checklist: 15-Minute Personal Consultation · Professional Profile Writing · Personalized Photo Selection ·
    Authentic, Customized Profile · One-Time Payment of $50
  - Primary button: "Let Us Build Your Profile — $50"; Secondary: "I'll Build My Own Profile"
- Flow: **Purchase → Schedule 15-min consultation → Consultation (video) → Consultant drafts profile + photo selection
  → Member reviews → Approve / Request changes → Publish.**
- Consultation covers: personality, career/accomplishments, hobbies, lifestyle, values, relationship goals,
  ideal partner, unique qualities.
- Photos: select from existing uploads only. **No photography sessions.**
- Member can edit their profile at any time afterward.
- Consultant dashboard (staff): queue of paid members, schedule, consultation notes (private), draft editor,
  submit-for-approval, revision requests.
- Refund policy: refundable until consultation is held (admin action); product decision to confirm.

**Acceptance:** a Concierge draft is never visible in the directory until the member's explicit approval; approval is audit-logged.

## 8. Available Now

- Member toggles **Available Now** and picks 15 / 30 / 60 minutes. Green indicator appears; auto-expires.
- Login ≠ available. Closing the app does not cancel it, but the member can end it any time.
- Dedicated **Available Now** directory with the same filters.
- **Request Call Now** → recipient gets an immediate push/in-app/email notification (60-second response window).
  Accept → both enter a 5-minute video room. Decline/timeout → nothing happens, requester told neutrally.
- A member can't be in two live requests at once; being in a call suspends Available Now.

## 9. Messaging Gate (inferred from truncated section)

- Before video intro: **no direct messaging, no inbox.** Allowed: appointment requests, confirmations,
  reschedules, cancellations, automated notifications.
- After a completed intro **and** mutual interest: a conversation unlocks.
- Goal: prevent endless chat that never becomes a real connection.
- Open question: is there an optional nudge to plan a real date after unlock?

## 10. Non-Goals (v1)
Swiping, call extensions, photography sessions, group events, native mobile apps, in-app gifting.

## 11. Trust and Safety (required for launch)
Report/block on every profile and in-call; ID/age verification; moderation queue; call-abuse reporting
(no recording in v1 unless legal approves); rate limits on requests; data export and delete.

## 12. Open Questions
1. Confirm §9, since the original prompt was truncated mid-sentence.
2. Product name and branding.
3. Refund policy for Concierge.
4. Video provider choice (Daily vs LiveKit).
5. Launch geography (drives tax, privacy, and age-verification requirements).
6. Is membership itself free, subscription-based, or per-intro? (Not specified.)
