import type { VerificationStatus } from "@prisma/client";

export type VerificationResult = {
  providerRef: string;
  status: VerificationStatus;
};

export class VerificationNotConfiguredError extends Error {
  constructor() {
    super("Verification webhook is not configured");
    this.name = "VerificationNotConfiguredError";
  }
}

/**
 * Seam for Stripe Identity / Persona (backlog #11 full integration).
 * Implementations must never log verification payloads or results.
 */
export interface VerificationProvider {
  start(input: { userId: string }): Promise<VerificationResult>;
  refresh(input: { providerRef: string }): Promise<VerificationResult>;
  /** Verifies the provider signature and returns the resulting status, or throws. */
  handleWebhook(input: {
    rawBody: string;
    headers: Headers;
  }): Promise<VerificationResult>;
}
