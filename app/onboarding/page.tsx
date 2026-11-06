import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { loadOnboardingState } from "@/lib/onboarding/service";
import { resumeStep } from "@/lib/onboarding/steps";

export default async function OnboardingIndex() {
  const user = await requireUser();
  const loaded = await loadOnboardingState(user.id);
  if (loaded?.completedAt) redirect("/discover");
  redirect(`/onboarding/${resumeStep(loaded?.state.completedSteps ?? []) ?? 7}`);
}
