import { TopNav } from "@/components/layout/top-nav";
import { requireOnboardedUser } from "@/lib/session";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireOnboardedUser();
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <TopNav />
      <main id="main" className="flex-1">
        {children}
      </main>
    </div>
  );
}
