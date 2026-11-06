import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold text-primary">[PRODUCT_NAME]</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        Five minutes to connect. The rest is up to you.
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        A non-swipe, appointment-based dating platform for career-driven professionals. Browse a
        searchable directory, read structured profiles, and book a five-minute video introduction.
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/sign-in">Sign in with email</Link>
        </Button>
      </div>
    </main>
  );
}
