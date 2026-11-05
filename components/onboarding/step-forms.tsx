"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INTENTIONS } from "@/lib/onboarding/steps";

type ApiResult = {
  ok: boolean;
  error?: string;
  next?: number | null;
  published?: boolean;
  verificationStatus?: string;
};

const ERRORS: Record<string, string> = {
  age_blocked: "You must be at least 18 years old to use this service.",
  dob_locked: "Your date of birth can't be changed. Contact support if it is wrong.",
  invalid_input: "Please check the highlighted fields and try again.",
  verification_failed: "Verification failed. Please start again.",
  verification_not_started: "Start verification first.",
};

function useStep(step: number) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(payload: unknown, opts: { navigate?: boolean } = { navigate: true }) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/onboarding/${step}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as ApiResult;
      if (!data.ok) {
        if (data.error === "age_blocked") {
          router.push("/age-blocked");
          return data;
        }
        setError(ERRORS[data.error ?? ""] ?? "Something went wrong. Please try again.");
        return data;
      }
      if (opts.navigate === false) router.refresh();
      else router.push(data.next ? `/onboarding/${data.next}` : "/discover");
      return data;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return { submit, error, pending };
}

function Errors({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="text-sm text-danger">
      {message}
    </p>
  ) : null;
}

export function BasicsForm(props: {
  firstName: string;
  city: string;
  timeZone: string;
  dob: string | null;
}) {
  const { submit, error, pending } = useStep(1);
  const detected =
    props.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        submit({
          firstName: f.get("firstName"),
          dob: props.dob ?? f.get("dob"),
          city: f.get("city"),
          timeZone: f.get("timeZone"),
        });
      }}
    >
      <Field id="firstName" label="First name">
        <Input id="firstName" name="firstName" defaultValue={props.firstName} required maxLength={60} />
      </Field>
      <Field id="dob" label="Date of birth" hint="You must be 18 or older. This can't be changed later.">
        <Input
          id="dob"
          name="dob"
          type="date"
          defaultValue={props.dob ?? ""}
          disabled={!!props.dob}
          required
        />
      </Field>
      <Field id="city" label="City / location">
        <Input id="city" name="city" defaultValue={props.city} required maxLength={100} />
      </Field>
      <Field id="timeZone" label="Time zone" hint="IANA name, e.g. America/New_York">
        <Input id="timeZone" name="timeZone" defaultValue={detected} required />
      </Field>
      <Errors message={error} />
      <Button type="submit" disabled={pending}>
        Save and continue
      </Button>
    </form>
  );
}

export function VerificationForm(props: { status: string; started: boolean }) {
  const { submit, error, pending } = useStep(2);
  return (
    <div className="space-y-4">
      <p className="text-sm">
        Status: <VerificationBadge status={props.started ? props.status : "NOT_STARTED"} />
      </p>
      <p className="text-sm text-muted-foreground">
        Identity and age verification runs through a provider. This build uses a development stub; unverified
        members can finish onboarding but won&apos;t be listed in the directory.
      </p>
      <Errors message={error} />
      <div className="flex flex-wrap gap-3">
        {(!props.started || props.status === "FAILED") && (
          <Button disabled={pending} onClick={() => submit({ action: "start" }, { navigate: false })}>
            Start verification
          </Button>
        )}
        {props.started && props.status !== "FAILED" && (
          <>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => submit({ action: "refresh" }, { navigate: false })}
            >
              Check status
            </Button>
            <Button disabled={pending} onClick={() => submit({ action: "continue" })}>
              Continue
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function VerificationBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    VERIFIED: "bg-green-50 text-success",
    PENDING: "bg-primary-soft text-primary",
    FAILED: "bg-red-50 text-danger",
    NOT_STARTED: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    VERIFIED: "Verified",
    PENDING: "Pending",
    FAILED: "Failed",
    NOT_STARTED: "Not started",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? styles.NOT_STARTED}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function ProfilePathForm() {
  const { submit, error, pending } = useStep(3);
  return (
    <div className="space-y-6">
      <div className="rounded-md bg-primary-soft p-5">
        <h2 className="text-xl font-bold">You&apos;re more interesting than your dating profile.</h2>
        <p className="mt-1 text-sm">
          You&apos;ve built an incredible life. Let&apos;s build a profile that reflects it.
        </p>
        <ul className="mt-3 list-disc pl-5 text-sm">
          <li>15-Minute Personal Consultation</li>
          <li>Professional Profile Writing</li>
          <li>Personalized Photo Selection</li>
          <li>Authentic, Customized Profile</li>
          <li>One-Time Payment of $50</li>
        </ul>
        <Button className="mt-4" disabled aria-describedby="concierge-soon">
          Let Us Build Your Profile — $50
        </Button>
        <p id="concierge-soon" className="mt-2 text-xs text-muted-foreground">
          Coming soon. You&apos;ll be able to add it later from Settings.
        </p>
      </div>
      <Errors message={error} />
      <Button variant="outline" disabled={pending} onClick={() => submit({ path: "BUILD_OWN" })}>
        I&apos;ll Build My Own Profile
      </Button>
    </div>
  );
}

export function PhotosForm() {
  const { submit, error, pending } = useStep(4);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Photo upload (3 to 10 photos, one primary) is coming soon. Until you have at least 3 photos your
        profile stays unpublished.
      </p>
      <Errors message={error} />
      <Button disabled={pending} onClick={() => submit({})}>
        Continue
      </Button>
    </div>
  );
}

export function PreferencesForm(props: {
  ageMin: number;
  ageMax: number;
  distanceKm: number;
  intentions: string[];
  dealbreakers: string[];
}) {
  const { submit, error, pending } = useStep(5);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        submit({
          ageMin: Number(f.get("ageMin")),
          ageMax: Number(f.get("ageMax")),
          distanceKm: Number(f.get("distanceKm")),
          intentions: f.getAll("intentions"),
          dealbreakers: String(f.get("dealbreakers") ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        });
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field id="ageMin" label="Minimum age">
          <Input id="ageMin" name="ageMin" type="number" min={18} max={99} defaultValue={props.ageMin} required />
        </Field>
        <Field id="ageMax" label="Maximum age">
          <Input id="ageMax" name="ageMax" type="number" min={18} max={99} defaultValue={props.ageMax} required />
        </Field>
      </div>
      <Field id="distanceKm" label="Maximum distance (km)">
        <Input id="distanceKm" name="distanceKm" type="number" min={1} max={500} defaultValue={props.distanceKm} required />
      </Field>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Relationship intentions</legend>
        {INTENTIONS.map((i) => (
          <label key={i} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="intentions" value={i} defaultChecked={props.intentions.includes(i)} />
            {i.replace(/-/g, " ")}
          </label>
        ))}
      </fieldset>
      <Field id="dealbreakers" label="Dealbreakers (optional)" hint="Comma-separated, up to 5. Only you see these.">
        <Input id="dealbreakers" name="dealbreakers" defaultValue={props.dealbreakers.join(", ")} />
      </Field>
      <Errors message={error} />
      <Button type="submit" disabled={pending}>
        Save and continue
      </Button>
    </form>
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function minToTime(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function AvailabilityForm(props: { days: number[]; startMin: number; endMin: number; timeZone: string }) {
  const { submit, error, pending } = useStep(6);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const end = String(f.get("end"));
        submit({
          days: f.getAll("days").map(Number),
          startMin: timeToMin(String(f.get("start"))),
          endMin: end === "00:00" ? 1440 : timeToMin(end),
        });
      }}
    >
      <p className="text-sm text-muted-foreground">
        Weekly window when others can request a 5-minute introduction, in {props.timeZone}.
      </p>
      <fieldset className="flex flex-wrap gap-3">
        <legend className="mb-2 text-sm font-medium">Days</legend>
        {DAYS.map((d, i) => (
          <label key={d} className="flex items-center gap-1 text-sm">
            <input type="checkbox" name="days" value={i} defaultChecked={props.days.includes(i)} />
            {d}
          </label>
        ))}
      </fieldset>
      <div className="grid grid-cols-2 gap-4">
        <Field id="start" label="From">
          <Input id="start" name="start" type="time" defaultValue={minToTime(props.startMin)} required />
        </Field>
        <Field id="end" label="To">
          <Input id="end" name="end" type="time" defaultValue={minToTime(props.endMin % 1440)} required />
        </Field>
      </div>
      <Errors message={error} />
      <Button type="submit" disabled={pending}>
        Save and continue
      </Button>
    </form>
  );
}

export function ReviewForm(props: { items: { label: string; value: string }[]; verified: boolean }) {
  const { submit, error, pending } = useStep(7);
  return (
    <div className="space-y-4">
      <dl className="divide-y divide-border rounded-md border border-border text-sm">
        {props.items.map((i) => (
          <div key={i.label} className="flex justify-between gap-4 px-4 py-2">
            <dt className="text-muted-foreground">{i.label}</dt>
            <dd className="font-medium">{i.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted-foreground">
        {props.verified
          ? "Your profile is published once it has at least 3 photos."
          : "You aren't verified yet. You can finish now; your profile won't be listed in the directory until you are verified."}
      </p>
      <Errors message={error} />
      <Button disabled={pending} onClick={() => submit({ action: "finish" })}>
        Finish and go to portal
      </Button>
    </div>
  );
}

function Field(props: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      {props.children}
      {props.hint && <p className="text-xs text-muted-foreground">{props.hint}</p>}
    </div>
  );
}
