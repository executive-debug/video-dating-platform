import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Responsive 3-column primitive: filters | results | detail on desktop,
 * a single stacked column on mobile.
 */
export function ThreeColumnLayout({
  left,
  center,
  right,
  className,
}: {
  left?: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[16rem_minmax(0,1fr)_24rem]",
        className,
      )}
    >
      {left && <aside aria-label="Filters" className="lg:sticky lg:top-20 lg:self-start">{left}</aside>}
      <section aria-label="Results" className="min-w-0 lg:col-start-2">{center}</section>
      {right && <aside aria-label="Details" className="lg:sticky lg:top-20 lg:self-start">{right}</aside>}
    </div>
  );
}
