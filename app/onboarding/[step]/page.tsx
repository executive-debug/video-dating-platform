import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Stepper } from "@/components/onboarding/stepper";
import {
  AvailabilityForm,
  BasicsForm,
  PhotosForm,
  PreferencesForm,
  ProfilePathForm,
  ReviewForm,
  VerificationForm,
} from "@/components/onboarding/step-forms";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { loadOnboardingState } from "@/lib/onboarding/service";
import {
  evaluateStepAccess,
  parseStepParam,
  resumeStep,
  STEP_TITLES,
} from "@/lib/onboarding/steps";

export const dynamic = "force-dynamic";

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const step = parseStepParam((await params).step);
  if (!step) notFound();

  const user = await requireUser();
  const loaded = await loadOnboardingState(user.id);
  if (!loaded) redirect("/sign-in");

  const access = evaluateStepAccess(loaded.state, step);
  if (!access.ok) {
    if (access.reason === "email_unverified") redirect("/sign-in");
    if (access.reason === "age_unverified") redirect("/onboarding/1");
    redirect(`/onboarding/${resumeStep(loaded.state.completedSteps) ?? 7}`);
  }

  const [profile, preference, rules] = await Promise.all([
    db.profile.findUnique({ where: { userId: user.id } }),
    db.preference.findUnique({ where: { userId: user.id } }),
    db.availabilityRule.findMany({ where: { userId: user.id } }),
  ]);
  const filters = (preference?.filters ?? {}) as { intentions?: string[]; dealbreakers?: string[] };
  const timeZone = profile?.timeZone ?? "UTC";

  let body: React.ReactNode;
  switch (step) {
    case 1:
      body = (
        <BasicsForm
          firstName={profile?.firstName ?? ""}
          city={profile?.city ?? ""}
          timeZone={profile?.timeZone ?? ""}
          dob={user.dob ? user.dob.toISOString().slice(0, 10) : null}
        />
      );
      break;
    case 2:
      body = <VerificationForm status={user.verificationStatus} started={!!user.verificationRef} />;
      break;
    case 3:
      body = <ProfilePathForm />;
      break;
    case 4:
      body = <PhotosForm />;
      break;
    case 5:
      body = (
        <PreferencesForm
          ageMin={preference?.ageMin ?? 25}
          ageMax={preference?.ageMax ?? 45}
          distanceKm={preference?.distanceKm ?? 50}
          intentions={filters.intentions ?? []}
          dealbreakers={filters.dealbreakers ?? []}
        />
      );
      break;
    case 6:
      body = (
        <AvailabilityForm
          days={rules.map((r) => r.weekday)}
          startMin={rules[0]?.startMin ?? 18 * 60}
          endMin={rules[0]?.endMin ?? 21 * 60}
          timeZone={timeZone}
        />
      );
      break;
    default:
      body = (
        <ReviewForm
          verified={user.verificationStatus === "VERIFIED"}
          items={[
            { label: "Name", value: profile?.firstName ?? "—" },
            { label: "City", value: profile?.city ?? "—" },
            { label: "Time zone", value: timeZone },
            { label: "Verification", value: user.verificationStatus },
            { label: "Profile path", value: loaded.profilePath === "BUILD_OWN" ? "Build my own" : "—" },
          ]}
        />
      );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <Stepper current={step} completed={loaded.state.completedSteps} />
      <Card>
        <h1 className="mb-6 text-2xl font-bold">
          Step {step}: {STEP_TITLES[step]}
        </h1>
        {body}
      </Card>
    </div>
  );
}
