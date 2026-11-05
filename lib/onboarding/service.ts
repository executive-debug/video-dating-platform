import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isAdult, parseDateOnly } from "@/lib/age";
import { getVerificationProvider } from "@/lib/verification";
import { canPublish } from "@/lib/profile-publish";
import {
  evaluateStepAccess,
  resumeStep,
  stepSchemas,
  type AccessResult,
  type OnboardingState,
} from "./steps";

export type StepResult =
  | { status: 200; body: { ok: true; next: number | null; published?: boolean; verificationStatus?: string } }
  | { status: 400 | 401 | 403 | 409 | 500; body: { ok: false; error: string; issues?: unknown } };

const ACCESS_STATUS: Record<
  Exclude<AccessResult, { ok: true }>["reason"],
  { status: 403 | 409; error: string }
> = {
  age_blocked: { status: 403, error: "age_blocked" },
  email_unverified: { status: 403, error: "email_unverified" },
  age_unverified: { status: 403, error: "age_unverified" },
  step_locked: { status: 409, error: "step_locked" },
};

export async function loadOnboardingState(userId: string): Promise<{
  state: OnboardingState;
  profilePath: "BUILD_OWN" | "CONCIERGE" | null;
  completedAt: Date | null;
} | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      emailVerified: true,
      dob: true,
      ageBlockedAt: true,
      onboarding: true,
    },
  });
  if (!user) return null;
  return {
    state: {
      emailVerified: !!user.emailVerified,
      dob: user.dob,
      ageBlocked: !!user.ageBlockedAt,
      completedSteps: user.onboarding?.completedSteps ?? [],
    },
    profilePath: user.onboarding?.profilePath ?? null,
    completedAt: user.onboarding?.completedAt ?? null,
  };
}

async function markComplete(
  tx: Prisma.TransactionClient,
  userId: string,
  step: number,
  extra: Prisma.OnboardingProgressUncheckedUpdateInput = {},
) {
  const existing = await tx.onboardingProgress.findUnique({ where: { userId } });
  const steps = new Set(existing?.completedSteps ?? []);
  steps.add(step);
  const completedSteps = [...steps].sort((a, b) => a - b);
  const next = await tx.onboardingProgress.upsert({
    where: { userId },
    create: { userId, completedSteps, ...(extra as object) },
    update: { completedSteps, ...extra },
  });
  return next.completedSteps;
}

function fail(
  status: 400 | 401 | 403 | 409 | 500,
  error: string,
  issues?: unknown,
): StepResult {
  return { status, body: { ok: false, error, issues } };
}

/** Validates and persists one onboarding step. All eligibility rules are enforced here, on the server. */
export async function submitStep(
  userId: string,
  step: number,
  rawInput: unknown,
  now: Date = new Date(),
): Promise<StepResult> {
  const loaded = await loadOnboardingState(userId);
  if (!loaded) return fail(401, "unauthenticated");

  const access = evaluateStepAccess(loaded.state, step, now);
  if (!access.ok) {
    const { status, error } = ACCESS_STATUS[access.reason];
    return fail(status, error);
  }

  const parsed = stepSchemas[step as 1].safeParse(rawInput);
  if (!parsed.success) return fail(400, "invalid_input", parsed.error.flatten());

  const input = parsed.data as never as Record<string, never> & Record<string, unknown>;
  const done = (completed: number[], extra: object = {}): StepResult => ({
    status: 200,
    body: { ok: true, next: resumeStep(completed), ...extra },
  });

  switch (step) {
    case 1: {
      const dob = parseDateOnly(input.dob as string)!;
      const stored = await db.user.findUnique({ where: { id: userId }, select: { dob: true } });
      if (stored?.dob && stored.dob.getTime() !== dob.getTime()) {
        return fail(409, "dob_locked");
      }
      if (!isAdult(dob, now)) {
        await db.$transaction([
          db.user.update({ where: { id: userId }, data: { ageBlockedAt: now, dob: null } }),
          db.session.deleteMany({ where: { userId } }),
        ]);
        return fail(403, "age_blocked");
      }
      const completed = await db.$transaction(async (tx) => {
        await tx.user.update({ where: { id: userId }, data: { dob } });
        await tx.profile.upsert({
          where: { userId },
          create: {
            userId,
            firstName: input.firstName as string,
            city: input.city as string,
            timeZone: input.timeZone as string,
          },
          update: {
            firstName: input.firstName as string,
            city: input.city as string,
            timeZone: input.timeZone as string,
          },
        });
        return markComplete(tx, userId, 1);
      });
      return done(completed);
    }

    case 2: {
      const provider = getVerificationProvider();
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { verificationRef: true, verificationStatus: true },
      });
      if (!user) return fail(401, "unauthenticated");
      const action = input.action as string;

      if (action === "start") {
        if (user.verificationRef && user.verificationStatus !== "FAILED") {
          return done(loaded.state.completedSteps, { verificationStatus: user.verificationStatus });
        }
        const result = await provider.start({ userId });
        await db.user.update({
          where: { id: userId },
          data: { verificationRef: result.providerRef, verificationStatus: result.status },
        });
        return done(loaded.state.completedSteps, { verificationStatus: result.status });
      }
      if (!user.verificationRef) return fail(409, "verification_not_started");

      if (action === "refresh") {
        const result = await provider.refresh({ providerRef: user.verificationRef });
        await db.user.update({
          where: { id: userId },
          data: { verificationStatus: result.status },
        });
        return done(loaded.state.completedSteps, { verificationStatus: result.status });
      }
      // continue
      if (user.verificationStatus === "FAILED") return fail(409, "verification_failed");
      const completed = await db.$transaction((tx) => markComplete(tx, userId, 2));
      return done(completed, { verificationStatus: user.verificationStatus });
    }

    case 3: {
      const completed = await db.$transaction((tx) =>
        markComplete(tx, userId, 3, { profilePath: "BUILD_OWN" }),
      );
      return done(completed);
    }

    case 4: {
      const completed = await db.$transaction((tx) => markComplete(tx, userId, 4));
      return done(completed);
    }

    case 5: {
      const filters = {
        intentions: input.intentions,
        dealbreakers: input.dealbreakers,
      } as Prisma.InputJsonValue;
      const completed = await db.$transaction(async (tx) => {
        await tx.preference.upsert({
          where: { userId },
          create: {
            userId,
            ageMin: input.ageMin as number,
            ageMax: input.ageMax as number,
            distanceKm: input.distanceKm as number,
            filters,
          },
          update: {
            ageMin: input.ageMin as number,
            ageMax: input.ageMax as number,
            distanceKm: input.distanceKm as number,
            filters,
          },
        });
        await tx.profile.update({
          where: { userId },
          data: { intentions: input.intentions as string[] },
        });
        return markComplete(tx, userId, 5);
      });
      return done(completed);
    }

    case 6: {
      const profile = await db.profile.findUnique({
        where: { userId },
        select: { timeZone: true },
      });
      if (!profile?.timeZone) return fail(409, "step_locked");
      const tz = profile.timeZone;
      const completed = await db.$transaction(async (tx) => {
        await tx.availabilityRule.deleteMany({ where: { userId } });
        await tx.availabilityRule.createMany({
          data: (input.days as number[]).map((weekday) => ({
            userId,
            weekday,
            startMin: input.startMin as number,
            endMin: input.endMin as number,
            tz,
          })),
        });
        return markComplete(tx, userId, 6);
      });
      return done(completed);
    }

    case 7: {
      const result = await db.$transaction(async (tx) => {
        const user = await tx.user.findUniqueOrThrow({
          where: { id: userId },
          select: {
            emailVerified: true,
            dob: true,
            verificationStatus: true,
            profile: { select: { firstName: true, status: true } },
            onboarding: { select: { profilePath: true } },
            _count: { select: { photos: true } },
          },
        });
        const publish =
          user.profile?.status === "DRAFT" &&
          canPublish(
            {
              verificationStatus: user.verificationStatus,
              dob: user.dob,
              emailVerified: !!user.emailVerified,
              profilePath: user.onboarding?.profilePath ?? null,
              photoCount: user._count.photos,
              firstName: user.profile?.firstName ?? null,
              profileStatus: user.profile.status,
            },
            now,
          );
        if (publish) {
          await tx.profile.update({ where: { userId }, data: { status: "PUBLISHED" } });
        }
        const completed = await markComplete(tx, userId, 7, { completedAt: now });
        return { completed, published: publish };
      });
      return done(result.completed, { published: result.published });
    }
  }
  return fail(400, "invalid_step");
}
