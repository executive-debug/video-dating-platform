import { describe, expect, it } from "vitest";
import {
  evaluateStepAccess,
  parseStepParam,
  resumeStep,
  step1Schema,
  step5Schema,
  step6Schema,
  type OnboardingState,
} from "@/lib/onboarding/steps";

const now = new Date("2026-06-15T12:00:00Z");
const adult = new Date("1990-01-01T00:00:00Z");
const base: OnboardingState = { emailVerified: true, dob: adult, ageBlocked: false, completedSteps: [1] };

describe("evaluateStepAccess", () => {
  it("allows step 1 with a verified email and no DOB yet", () => {
    expect(evaluateStepAccess({ ...base, dob: null, completedSteps: [] }, 1, now)).toEqual({ ok: true });
  });
  it("blocks step 2 without a verified email", () => {
    expect(evaluateStepAccess({ ...base, emailVerified: false }, 2, now)).toEqual({ ok: false, reason: "email_unverified" });
  });
  it("blocks step 2 without a DOB", () => {
    expect(evaluateStepAccess({ ...base, dob: null }, 2, now)).toEqual({ ok: false, reason: "age_unverified" });
  });
  it("blocks step 2 for an under-18 DOB", () => {
    expect(evaluateStepAccess({ ...base, dob: new Date("2010-01-01T00:00:00Z") }, 2, now)).toEqual({ ok: false, reason: "age_unverified" });
  });
  it("blocks age-blocked users everywhere, even step 1", () => {
    expect(evaluateStepAccess({ ...base, ageBlocked: true }, 1, now)).toEqual({ ok: false, reason: "age_blocked" });
  });
  it("does not allow skipping ahead", () => {
    expect(evaluateStepAccess(base, 4, now)).toEqual({ ok: false, reason: "step_locked" });
    expect(evaluateStepAccess(base, 2, now)).toEqual({ ok: true });
  });
  it("allows revisiting completed steps", () => {
    expect(evaluateStepAccess({ ...base, completedSteps: [1, 2, 3] }, 1, now)).toEqual({ ok: true });
  });
});

describe("resumeStep / parseStepParam", () => {
  it("finds the first incomplete step", () => {
    expect(resumeStep([])).toBe(1);
    expect(resumeStep([1, 2, 4])).toBe(3);
    expect(resumeStep([1, 2, 3, 4, 5, 6, 7])).toBeNull();
  });
  it("only accepts steps 1 to 7", () => {
    expect(parseStepParam("7")).toBe(7);
    expect(parseStepParam("0")).toBeNull();
    expect(parseStepParam("8")).toBeNull();
    expect(parseStepParam("1; drop")).toBeNull();
  });
});

describe("step schemas", () => {
  it("validates step 1", () => {
    const ok = step1Schema.safeParse({ firstName: "Sam", dob: "1990-05-05", city: "Denver", timeZone: "America/Denver" });
    expect(ok.success).toBe(true);
    expect(step1Schema.safeParse({ firstName: "Sam", dob: "1990-05-05", city: "Denver", timeZone: "Mars/Base" }).success).toBe(false);
    expect(step1Schema.safeParse({ firstName: "Sam", dob: "2999-01-01", city: "Denver", timeZone: "UTC" }).success).toBe(false);
  });
  it("validates step 5 age range and intentions", () => {
    expect(step5Schema.safeParse({ ageMin: 40, ageMax: 30, distanceKm: 10, intentions: ["marriage"] }).success).toBe(false);
    expect(step5Schema.safeParse({ ageMin: 17, ageMax: 30, distanceKm: 10, intentions: ["marriage"] }).success).toBe(false);
    expect(step5Schema.safeParse({ ageMin: 30, ageMax: 40, distanceKm: 10, intentions: [] }).success).toBe(false);
  });
  it("validates step 6 windows", () => {
    expect(step6Schema.safeParse({ days: [1], startMin: 600, endMin: 603 }).success).toBe(false);
    expect(step6Schema.safeParse({ days: [1], startMin: 600, endMin: 660 }).success).toBe(true);
  });
});
