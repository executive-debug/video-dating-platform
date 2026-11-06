import { describe, expect, it } from "vitest";
import { createStubProvider } from "@/lib/verification/stub";
import { VerificationNotConfiguredError } from "@/lib/verification/provider";
import { canPublish, type PublishInput } from "@/lib/profile-publish";

describe("stub verification provider", () => {
  it("starts as PENDING", async () => {
    expect((await createStubProvider("development").start({ userId: "u1" })).status).toBe("PENDING");
  });
  it("auto-verifies outside production only", async () => {
    expect((await createStubProvider("development").refresh({ providerRef: "r" })).status).toBe("VERIFIED");
    expect((await createStubProvider("production").refresh({ providerRef: "r" })).status).toBe("PENDING");
  });
  it("rejects webhooks", async () => {
    await expect(
      createStubProvider().handleWebhook({ rawBody: "{}", headers: new Headers() }),
    ).rejects.toBeInstanceOf(VerificationNotConfiguredError);
  });
});

describe("canPublish", () => {
  const ok: PublishInput = {
    verificationStatus: "VERIFIED",
    dob: new Date("1990-01-01T00:00:00Z"),
    emailVerified: true,
    profilePath: "BUILD_OWN",
    photoCount: 3,
    firstName: "Sam",
    profileStatus: "DRAFT",
  };
  it("publishes a verified, complete, adult, self-built profile", () => {
    expect(canPublish(ok)).toBe(true);
  });
  it.each([
    ["unverified", { verificationStatus: "PENDING" as const }],
    ["failed verification", { verificationStatus: "FAILED" as const }],
    ["under 18", { dob: new Date("2015-01-01T00:00:00Z") }],
    ["no dob", { dob: null }],
    ["too few photos", { photoCount: 2 }],
    ["unverified email", { emailVerified: false }],
    ["concierge path (needs member approval flow)", { profilePath: "CONCIERGE" as const }],
    ["no name", { firstName: null }],
  ])("never publishes: %s", (_, patch) => {
    expect(canPublish({ ...ok, ...patch })).toBe(false);
  });
});
