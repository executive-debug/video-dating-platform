import { createStubProvider } from "./stub";
import type { VerificationProvider } from "./provider";

let provider: VerificationProvider | undefined;

// Swap in the Stripe Identity / Persona implementation here when #11 is completed.
export function getVerificationProvider(): VerificationProvider {
  provider ??= createStubProvider();
  return provider;
}
