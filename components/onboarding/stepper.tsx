import Link from "next/link";
import { cn } from "@/lib/utils";
import { STEP_TITLES, TOTAL_STEPS } from "@/lib/onboarding/steps";

export function Stepper({ current, completed }: { current: number; completed: number[] }) {
  return (
    <nav aria-label="Onboarding progress">
      <ol className="flex flex-wrap gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => {
          const done = completed.includes(s);
          const reachable = done || s === current;
          const pill = (
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                s === current
                  ? "border-primary bg-primary-soft text-primary"
                  : done
                    ? "border-border text-foreground"
                    : "border-border text-muted-foreground",
              )}
              aria-current={s === current ? "step" : undefined}
            >
              {s}. {STEP_TITLES[s]}
              {done && <span className="sr-only"> (completed)</span>}
            </span>
          );
          return (
            <li key={s}>
              {reachable && s !== current ? <Link href={`/onboarding/${s}`}>{pill}</Link> : pill}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
