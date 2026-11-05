import {
  VerificationNotConfiguredError,
  type VerificationProvider,
} from "./provider";

/**
 * Development stub. Outside production it reports VERIFIED on refresh so the
 * wizard can be exercised end to end. In production it never auto-verifies:
 * members stay PENDING (and out of the directory) until a real provider exists.
 */
export function createStubProvider(
  env: string | undefined = process.env.NODE_ENV,
): VerificationProvider {
  return {
    async start({ userId }) {
      return { providerRef: `stub_${userId}`, status: "PENDING" };
    },
    async refresh({ providerRef }) {
      return {
        providerRef,
        status: env === "production" ? "PENDING" : "VERIFIED",
      };
    },
    async handleWebhook() {
      throw new VerificationNotConfiguredError();
    },
  };
}
