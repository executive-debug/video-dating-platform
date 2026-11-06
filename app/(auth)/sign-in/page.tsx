import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/onboarding");

  async function sendLink(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    try {
      await signIn("nodemailer", { email, redirectTo: "/onboarding" });
    } catch (e) {
      if (e instanceof AuthError) redirect("/sign-in?error=1");
      throw e;
    }
  }

  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a one-time sign-in link. You must be 18 or older.
        </p>
        <form action={sendLink} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <Button type="submit" className="w-full">
            Email me a sign-in link
          </Button>
        </form>
      </Card>
    </main>
  );
}
