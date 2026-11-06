import { ThreeColumnLayout } from "@/components/layout/three-column";
import { Card } from "@/components/ui/card";

export function EmptyPortalPage({ title, description }: { title: string; description: string }) {
  return (
    <ThreeColumnLayout
      center={
        <Card>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{description}</p>
          <p className="mt-6 rounded-md bg-primary-soft px-4 py-3 text-sm text-primary">
            Nothing here yet. This area arrives in an upcoming milestone.
          </p>
        </Card>
      }
    />
  );
}
