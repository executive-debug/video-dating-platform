import type { ProfileStatus, VerificationStatus } from "@prisma/client";
import { isAdult } from "@/lib/age";

export const MIN_PHOTOS = 3;

export type PublishInput = {
  verificationStatus: VerificationStatus;
  dob: Date | null;
  emailVerified: boolean;
  profilePath: "BUILD_OWN" | "CONCIERGE" | null;
  photoCount: number;
  firstName: string | null;
  profileStatus: ProfileStatus;
};

/**
 * Directory visibility gate: only verified adults with a complete, self-authored
 * profile are published. Concierge profiles publish only via member approval.
 */
export function canPublish(input: PublishInput, now: Date = new Date()): boolean {
  return (
    input.emailVerified &&
    input.verificationStatus === "VERIFIED" &&
    isAdult(input.dob, now) &&
    input.profilePath === "BUILD_OWN" &&
    input.photoCount >= MIN_PHOTOS &&
    !!input.firstName
  );
}
