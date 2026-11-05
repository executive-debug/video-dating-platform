import { Card } from "@/components/ui/card";

export default function AgeBlockedPage() {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <h1 className="text-2xl font-bold">You can&apos;t use this service</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You must be at least 18 years old to create an account.
        </p>
      </Card>
    </main>
  );
}
