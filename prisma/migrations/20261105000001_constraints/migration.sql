-- Hand-written constraints that Prisma's schema language cannot express.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prisma DateTime columns are `timestamp` holding UTC, hence tsrange rather than tstzrange.
-- No double booking: a participant cannot hold two overlapping active appointments.
-- Rows are inserted in the same transaction as the Appointment; `active` is cleared when the
-- appointment leaves an active status (declined, cancelled, expired, ...).
ALTER TABLE "AppointmentParticipant"
  ADD CONSTRAINT "AppointmentParticipant_no_overlap"
  EXCLUDE USING gist (
    "userId" WITH =,
    tsrange("startsAt", "endsAt", '[)') WITH &&
  ) WHERE ("active");

ALTER TABLE "AppointmentParticipant"
  ADD CONSTRAINT "AppointmentParticipant_valid_range" CHECK ("endsAt" > "startsAt");

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_valid_range" CHECK ("endsAt" > "startsAt"),
  ADD CONSTRAINT "Appointment_distinct_users" CHECK ("requesterId" <> "recipientId");

-- At most one active Available Now session per user.
CREATE UNIQUE INDEX "AvailableNowSession_one_active_per_user"
  ON "AvailableNowSession" ("userId") WHERE "endedAt" IS NULL;

ALTER TABLE "AvailableNowSession"
  ADD CONSTRAINT "AvailableNowSession_valid_duration" CHECK (
    "expiresAt" - "startsAt" IN (interval '15 minutes', interval '30 minutes', interval '60 minutes')
  );

-- Canonical ordering so a pair can only ever have one Match row.
ALTER TABLE "Match"
  ADD CONSTRAINT "Match_ordered_users" CHECK ("userAId" < "userBId");

-- Interest signals are between two different people.
ALTER TABLE "InterestSignal"
  ADD CONSTRAINT "InterestSignal_distinct_users" CHECK ("fromUserId" <> "toUserId");
