import { Card } from "@/components/ui/card";

export default function CheckEmailPage() {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent you a sign-in link. Open it on this device to continue. The link expires in 24 hours.
        </p>
      </Card>
    </main>
  );
}
