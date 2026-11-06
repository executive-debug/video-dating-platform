import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { submitStep } from "@/lib/onboarding/service";

// Requires a migrated Postgres (DATABASE_URL). CI provides one.
const run = process.env.DATABASE_URL ? describe : describe.skip;
const tag = `it-${Date.now()}`;
const created: string[] = [];

async function newUser(over: { emailVerified?: Date | null; dob?: Date | null } = {}) {
  const u = await db.user.create({
    data: {
      email: `${tag}-${created.length}@example.test`,
      emailVerified: "emailVerified" in over ? over.emailVerified : new Date(),
      dob: over.dob ?? null,
    },
  });
  created.push(u.id);
  return u;
}

const basics = (dob: string) => ({ firstName: "Sam", dob, city: "Denver", timeZone: "America/Denver" });

afterAll(async () => {
  if (!process.env.DATABASE_URL) return;
  await db.user.deleteMany({ where: { id: { in: created } } });
  await db.$disconnect();
});

run("onboarding server-side enforcement", () => {
  it("blocks an under-18 DOB, stores no DOB and flags the account", async () => {
    const u = await newUser();
    const res = await submitStep(u.id, 1, basics("2015-01-01"));
    expect(res.status).toBe(403);
    const row = await db.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(row.dob).toBeNull();
    expect(row.ageBlockedAt).not.toBeNull();
    // No retry with a different date.
    expect((await submitStep(u.id, 1, basics("1990-01-01"))).status).toBe(403);
  });

  it("requires a verified email", async () => {
    const u = await newUser({ emailVerified: null });
    expect((await submitStep(u.id, 1, basics("1990-01-01"))).status).toBe(403);
  });

  it("refuses step 2+ until step 1 stored an adult DOB, and cannot be skipped", async () => {
    const u = await newUser();
    expect((await submitStep(u.id, 2, { action: "start" })).status).toBe(403);
    expect((await submitStep(u.id, 1, basics("1990-01-01"))).status).toBe(200);
    expect((await submitStep(u.id, 2, { action: "start" })).status).toBe(200);
    expect((await submitStep(u.id, 4, {})).status).toBe(409);
  });

  it("does not allow a user with a missing DOB past step 1 even if progress rows exist", async () => {
    const u = await newUser();
    await db.onboardingProgress.create({ data: { userId: u.id, completedSteps: [1] } });
    expect((await submitStep(u.id, 2, { action: "start" })).status).toBe(403);
  });

  it("locks the DOB after it is set", async () => {
    const u = await newUser();
    await submitStep(u.id, 1, basics("1990-01-01"));
    expect((await submitStep(u.id, 1, basics("1985-01-01"))).status).toBe(409);
  });

  it("walks the full wizard; unverified members finish but stay unpublished", async () => {
    const u = await newUser();
    expect((await submitStep(u.id, 1, basics("1990-01-01"))).status).toBe(200);
    await submitStep(u.id, 2, { action: "start" });
    expect((await submitStep(u.id, 2, { action: "continue" })).status).toBe(200);
    expect((await submitStep(u.id, 3, { path: "BUILD_OWN" })).status).toBe(200);
    expect((await submitStep(u.id, 4, {})).status).toBe(200);
    expect((await submitStep(u.id, 5, { ageMin: 28, ageMax: 40, distanceKm: 30, intentions: ["long-term"] })).status).toBe(200);
    expect((await submitStep(u.id, 6, { days: [1, 3], startMin: 1080, endMin: 1260 })).status).toBe(200);
    const fin = await submitStep(u.id, 7, { action: "finish" });
    expect(fin).toMatchObject({ status: 200, body: { ok: true, next: null, published: false } });
    const profile = await db.profile.findUniqueOrThrow({ where: { userId: u.id } });
    expect(profile.status).toBe("DRAFT");
    expect((await db.onboardingProgress.findUniqueOrThrow({ where: { userId: u.id } })).completedAt).not.toBeNull();
  });

  it("publishes only when verified with 3+ photos", async () => {
    const u = await newUser();
    await submitStep(u.id, 1, basics("1990-01-01"));
    await submitStep(u.id, 2, { action: "start" });
    await submitStep(u.id, 2, { action: "refresh" }); // stub: VERIFIED outside production
    await submitStep(u.id, 2, { action: "continue" });
    await submitStep(u.id, 3, { path: "BUILD_OWN" });
    await submitStep(u.id, 4, {});
    await submitStep(u.id, 5, { ageMin: 28, ageMax: 40, distanceKm: 30, intentions: ["long-term"] });
    await submitStep(u.id, 6, { days: [2], startMin: 600, endMin: 660 });
    await db.photo.createMany({
      data: [0, 1, 2].map((order) => ({ userId: u.id, url: `https://example.test/${order}.jpg`, order, isPrimary: order === 0 })),
    });
    const fin = await submitStep(u.id, 7, { action: "finish" });
    expect(fin).toMatchObject({ status: 200, body: { published: true } });
  });
});

run("database-level guarantees", () => {
  const ids: string[] = [];
  beforeAll(async () => {
    for (let i = 0; i < 5; i++) ids.push((await newUser()).id);
  });

  it("rejects overlapping active appointments for a participant", async () => {
    const [a, b, c, d, e] = ids;
    const start = new Date("2030-01-01T10:00:00Z");
    const end = new Date("2030-01-01T10:05:00Z");
    const mk = (r: string, p: string) =>
      db.appointment.create({
        data: {
          requesterId: r,
          recipientId: p,
          startsAt: start,
          endsAt: end,
          participants: {
            create: [
              { userId: r, startsAt: start, endsAt: end },
              { userId: p, startsAt: start, endsAt: end },
            ],
          },
        },
      });
    await mk(a, b);
    await expect(mk(c, b)).rejects.toThrow();
    // Two concurrent requests for the same free slot: exactly one wins.
    const concurrent = await Promise.allSettled([mk(d, e), mk(e, d)]);
    expect(concurrent.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });

  it("cannot insert a message without a conversation (hence without a match)", async () => {
    await expect(
      db.message.create({ data: { conversationId: "nope", senderId: ids[0], body: "hi" } }),
    ).rejects.toThrow();
  });
});
