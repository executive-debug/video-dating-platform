import { z } from "zod";
import { isAdult, parseDateOnly } from "@/lib/age";

export const TOTAL_STEPS = 7;

export const STEP_TITLES: Record<number, string> = {
  1: "Basics",
  2: "Verification",
  3: "Profile path",
  4: "Photos",
  5: "Preferences",
  6: "Availability",
  7: "Review and publish",
};

export const INTENTIONS = [
  "long-term",
  "marriage",
  "serious-dating",
  "open-to-see",
] as const;

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const timeZone = z.string().trim().min(1).max(64).refine(isValidTimeZone, "Invalid time zone");

export const step1Schema = z.object({
  firstName: z.string().trim().min(1).max(60),
  dob: z
    .string()
    .refine((v) => parseDateOnly(v) !== null, "Enter a valid date")
    .refine((v) => {
      const d = parseDateOnly(v)!;
      return d.getUTCFullYear() >= 1900 && d.getTime() <= Date.now();
    }, "Enter a valid date"),
  city: z.string().trim().min(1).max(100),
  timeZone,
});

export const step2Schema = z.object({
  action: z.enum(["start", "refresh", "continue"]),
});

// The Concierge purchase flow ships with backlog #43/#44; only the self-build path is accepted for now.
export const step3Schema = z.object({
  path: z.literal("BUILD_OWN"),
});

// Photo upload ships with backlog #12.
export const step4Schema = z.object({}).strict();

export const step5Schema = z
  .object({
    ageMin: z.number().int().min(18).max(99),
    ageMax: z.number().int().min(18).max(99),
    distanceKm: z.number().int().min(1).max(500),
    intentions: z.array(z.enum(INTENTIONS)).min(1).max(INTENTIONS.length),
    dealbreakers: z.array(z.string().trim().min(1).max(80)).max(5).default([]),
  })
  .refine((v) => v.ageMin <= v.ageMax, {
    message: "Minimum age must not exceed maximum age",
    path: ["ageMin"],
  });

export const step6Schema = z
  .object({
    days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    startMin: z.number().int().min(0).max(1439),
    endMin: z.number().int().min(1).max(1440),
  })
  .refine((v) => v.endMin - v.startMin >= 5, {
    message: "Window must be at least 5 minutes",
    path: ["endMin"],
  });

export const step7Schema = z.object({
  action: z.literal("finish"),
});

export const stepSchemas = {
  1: step1Schema,
  2: step2Schema,
  3: step3Schema,
  4: step4Schema,
  5: step5Schema,
  6: step6Schema,
  7: step7Schema,
} as const;

export function parseStepParam(raw: string): number | null {
  if (!/^[1-7]$/.test(raw)) return null;
  return Number(raw);
}

export type OnboardingState = {
  emailVerified: boolean;
  dob: Date | null;
  ageBlocked: boolean;
  completedSteps: number[];
};

export type AccessResult =
  | { ok: true }
  | {
      ok: false;
      reason: "age_blocked" | "email_unverified" | "age_unverified" | "step_locked";
    };

/** First step that has not been completed, or null when every step is done. */
export function resumeStep(completed: number[]): number | null {
  for (let s = 1; s <= TOTAL_STEPS; s++) {
    if (!completed.includes(s)) return s;
  }
  return null;
}

/**
 * Server-side gate for every onboarding read and write.
 * Steps 2+ require a verified email and a stored DOB showing 18+.
 */
export function evaluateStepAccess(
  state: OnboardingState,
  step: number,
  now: Date = new Date(),
): AccessResult {
  if (state.ageBlocked) return { ok: false, reason: "age_blocked" };
  if (!state.emailVerified) return { ok: false, reason: "email_unverified" };
  if (step >= 2 && !isAdult(state.dob, now)) {
    return { ok: false, reason: "age_unverified" };
  }
  const resume = resumeStep(state.completedSteps) ?? TOTAL_STEPS;
  if (step > resume) return { ok: false, reason: "step_locked" };
  return { ok: true };
}
