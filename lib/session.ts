import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadOnboardingState } from "@/lib/onboarding/service";
import { resumeStep } from "@/lib/onboarding/steps";

/** Server-side guard: signed in, not age-blocked. Redirects otherwise. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/sign-in");
  if (user.ageBlockedAt) redirect("/age-blocked");
  return user;
}

/** Portal guard: additionally requires finished onboarding, otherwise resumes the wizard. */
export async function requireOnboardedUser() {
  const user = await requireUser();
  const loaded = await loadOnboardingState(user.id);
  if (!loaded?.completedAt) {
    redirect(`/onboarding/${resumeStep(loaded?.state.completedSteps ?? []) ?? 7}`);
  }
  return user;
}
